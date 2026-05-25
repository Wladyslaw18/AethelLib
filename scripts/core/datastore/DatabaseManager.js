import { Kernel } from "../Kernel.js"

// ----------------------------------------------------------------------------
// | class: DatabaseManager                                                   |
// | manages persistent data using bedrock's dynamic properties.              |
// | uses a cache-aside strategy and debounced writes to keep things fast.    |
// | handles sharding for data that exceeds the native 32KB limit.            |
// ----------------------------------------------------------------------------
export class DatabaseManager {
    // ----------------------------------------------------------------------------
    // | constructor                                                              |
    // | setup the maps and constants. bedrock properties are limited, so we need  |
    // | to be smart about how we store things.                                   |
    // ----------------------------------------------------------------------------
    constructor() {
        // in-memory data cache. avoids reading from the world every time.
        this.cache = new Map() 
        // keys that have been modified and need to be written to the world.
        this.dirtyKeys = new Set() 
        // handle for the debounce timer.
        this.writeTimeout = null
        // wait 5 seconds before flushing to disk to avoid lag spikes.
        this.WRITE_DELAY = 5000 
        // bedrock's limit is technically 32kb, but we leave some breathing room.
        this.MAX_PROPERTY_SIZE = 30000 
        // how many items to keep in a single sharded slice.
        this.SHARD_SIZE = 50 
        
        // keeps track of sequential operations for entities to prevent race conditions.
        this.transactionQueues = new Map() 
        
        // tracks if the ghost purger is already running to prevent overlap.
        this.isPurgingGhosts = false
        
        // start the background tasks.
        this.initialize()
    }

    // ----------------------------------------------------------------------------
    // | method: initialize                                                       |
    // | setup periodic cleanup and flush on shutdown.                            |
    // ----------------------------------------------------------------------------
    initialize() {
        // run cleanup every 20 minutes to clear the cache.
        Kernel.system.runInterval(() => {
            this.cleanupExpiredData()
        }, 20 * 60 * 20) 
        
        // make sure everything is saved before the server stops.
        Kernel.system.beforeEvents.shutdown.subscribe(() => {
            this.flushAll()
        })

        // Recover WAL and run migration on boot!
        Kernel.system.run(async () => {
            await this.resolvePendingWal()
            await this.runOneTimeIndexMigration()
        })
    }

    // ----------------------------------------------------------------------------
    // | method: get                                                              |
    // | fetch data by key. checks cache first, then world storage.               |
    // ----------------------------------------------------------------------------
    get(key) {
        // check the memory buffer first. O(1) speed.
        if (this.cache.has(key)) {
            const data = this.cache.get(key)
            // Move to the end of insertion order (most recently used)
            this.cache.delete(key)
            this.cache.set(key, data)
            return data
        }

        // if not in cache, load it from the actual world properties.
        const data = this.loadFromStorage(key)
        if (data !== null) {
            // save it in cache so the next call is fast.
            this.cache.set(key, data)
        }
        return data
    }

    // ----------------------------------------------------------------------------
    // | method: set                                                              |
    // | save data. updates cache and schedules a background write.               |
    // ----------------------------------------------------------------------------
    set(key, value) {
        try {
            // update the memory buffer immediately.
            // delete first if it already exists to move it to the end of insertion order.
            if (this.cache.has(key)) {
                this.cache.delete(key)
            }
            this.cache.set(key, value)
            
            // Hard cap cache memory (LRU eviction of clean keys)
            if (this.cache.size > 1500) {
                let evicted = 0
                for (const [k, _] of this.cache.entries()) {
                    if (evicted >= 200) break
                    if (k !== key && !this.dirtyKeys.has(k) && !this.isProtectedKey(k)) {
                        this.cache.delete(k)
                        evicted++
                    }
                }
            }

            // mark the key as 'dirty' so it gets flushed to disk later.
            this.dirtyKeys.add(key)
            // schedule the write task if it isn't already running.
            this.scheduleWrite()
            return true
        } catch (error) {
            // if we fail here, the data is only in memory and will be lost on crash.
            console.error(`[DatabaseManager] COMMIT_FAILURE for '${key}': ${error}`)
            return false
        }
    }

    // ----------------------------------------------------------------------------
    // | method: delete                                                           |
    // | remove data from everywhere.                                             |
    // ----------------------------------------------------------------------------
    delete(key) {
        try {
            // remove from memory.
            this.cache.delete(key)
            // remove from the dirty set so we don't try to save it.
            this.dirtyKeys.delete(key)
            // actually remove it from bedrock's world storage.
            Kernel.world.setDynamicProperty(key, undefined)
            return true
        } catch (error) {
            console.error(`[DatabaseManager] DECOMMISSION_FAILURE for '${key}': ${error}`)
            return false
        }
    }

    // ----------------------------------------------------------------------------
    // | method: getSharded                                                       |
    // | handles collections of items that are split across multiple keys.        |
    // ----------------------------------------------------------------------------
    getSharded(collectionName, itemId = null) {
        // if we just want one item, go get it directly.
        if (itemId) {
            return this.get(`${collectionName}:item:${itemId}`)
        }

        // otherwise, load the index and fetch everything.
        const indexKey = `${collectionName}:index`
        const index = this.get(indexKey) || []
        
        const collection = []
        for (const id of index) {
            const item = this.get(`${collectionName}:item:${id}`)
            if (item) {
                collection.push(item)
            }
        }
        
        return collection
    }

    // ----------------------------------------------------------------------------
    // | method: setSharded                                                       |
    // | saves an item into a sharded collection. updates the index too.          |
    // ----------------------------------------------------------------------------
    setSharded(collectionName, itemId, data) {
        try {
            // save the item itself.
            this.set(`${collectionName}:item:${itemId}`, data)
            
            // update the collection index so we know this item exists.
            const indexKey = `${collectionName}:index`
            const index = this.get(indexKey) || []
            
            // if it's a new item, add it to the list.
            if (!index.includes(itemId)) {
                index.push(itemId)
                this.set(indexKey, index)
            }
            
            return true
        } catch (error) {
            console.error(`[DatabaseManager] SHARDED_COMMIT_FAILURE: ${error}`)
            return false
        }
    }

    // ----------------------------------------------------------------------------
    // | method: deleteSharded                                                    |
    // | removes an item from a sharded collection and cleans up its residue.     |
    // ----------------------------------------------------------------------------
    deleteSharded(collectionName, itemId) {
        try {
            const key = `${collectionName}:item:${itemId}`
            
            // check if this item was sharded (split across multiple keys).
            const indexData = Kernel.world.getDynamicProperty(`${key}:shard_index`)
            if (typeof indexData === "string") {
                try {
                    // parse the shard index and nuke all the segments.
                    const index = JSON.parse(indexData)
                    for (let i = 0; i < index.shardCount; i++) {
                        Kernel.world.setDynamicProperty(`${key}:shard_${index.version}_${i}`, undefined)
                    }
                    // clear the shard index itself.
                    Kernel.world.setDynamicProperty(`${key}:shard_index`, undefined)
                } catch (e) {
                    console.error(`[DatabaseManager] ORPHAN_NUKE_FAILURE for '${key}': ${e}`)
                }
            }
            
            // delete the main key.
            this.delete(key)
            
            // remove from the collection index.
            const indexKey = `${collectionName}:index`
            let index = this.get(indexKey) || []
            index = index.filter(id => id !== itemId)
            this.set(indexKey, index)
            
            return true
        } catch (error) {
            console.error(`[DatabaseManager] SHARDED_DECOMMISSION_FAILURE: ${error}`)
            return false
        }
    }

    // ----------------------------------------------------------------------------
    // | method: transaction                                                      |
    // | forces operations to run one-by-one for a specific player.                |
    // | prevents balance dupes and race conditions during async operations.      |
    // ----------------------------------------------------------------------------
    async transaction(playerId, operation) {
        // get or create a promise chain for this player.
        if (!this.transactionQueues.has(playerId)) {
            this.transactionQueues.set(playerId, Promise.resolve())
        }

        const queue = this.transactionQueues.get(playerId)
        
        // append the new operation to the end of the chain.
        const newOperation = queue.then(async () => {
            try {
                // run the actual logic.
                return await operation()
            } catch (error) {
                // if it fails, log it but keep the chain moving.
                console.error(`[DatabaseManager] TRANSACTION_COLLAPSE for '${playerId}': ${error}`)
                throw error
            }
        })

        // update the queue with the new tail.
        this.transactionQueues.set(playerId, newOperation)
        
        // when the operation finishes, check if we can clear the queue entry to save memory.
        newOperation.finally(() => {
            if (this.transactionQueues.get(playerId) === newOperation) {
                this.transactionQueues.delete(playerId)
            }
        })

        return newOperation
    }

    // ----------------------------------------------------------------------------
    // | method: loadFromStorage                                                  |
    // | internal helper to read from the world. handles sharding detection.      |
    // ----------------------------------------------------------------------------
    loadFromStorage(key) {
        try {
            // priority 1: check if this data was split into shards.
            const indexKey = `${key}:shard_index`
            if (Kernel.world.getDynamicProperty(indexKey)) {
                return this.loadSharded(key)
            }

            // priority 2: standard single-key resolution.
            const raw = Kernel.world.getDynamicProperty(key)
            if (typeof raw !== "string") return null
            try {
                return JSON.parse(raw)
            } catch (err) {
                console.error(`[DatabaseManager] JSON_PARSE_CORRUPT for '${key}': ${err}`)
                return null
            }
        } catch (error) {
            console.error(`[DatabaseManager] RETRIEVAL_FAILURE for '${key}': ${error}`)
            return null
        }
    }

    // ----------------------------------------------------------------------------
    // | method: scheduleWrite                                                    |
    // | debounces write requests so we don't spam the world storage.            |
    // ----------------------------------------------------------------------------
    scheduleWrite() {
        // if a write is already pending, cancel it and restart the timer.
        if (this.writeTimeout) {
            Kernel.system.clearRun(this.writeTimeout)
        }

        // wait for the delay before flushing.
        this.writeTimeout = Kernel.system.runTimeout(() => {
            this.flushDirty()
        }, Math.max(1, Math.floor(this.WRITE_DELAY / 50)))
    }

    // ----------------------------------------------------------------------------
    // | method: flushDirty                                                       |
    // | the physical write operation. moves data from memory to world.           |
    // ----------------------------------------------------------------------------
    flushDirty() {
        // copy the keys and clear the set so new changes can be tracked.
        const keysToWrite = Array.from(this.dirtyKeys)
        this.dirtyKeys.clear()

        let shardedWriteOccurred = false

        for (const key of keysToWrite) {
            // only write if the data actually exists in cache.
            if (this.cache.has(key)) {
                try {
                    const data = this.cache.get(key)
                    const serialized = JSON.stringify(data)
                    
                    // check if the string is too long for a single property.
                    if (serialized.length > this.MAX_PROPERTY_SIZE) {
                        // use the sharding protocol to split it up.
                        this.shardAndWrite(key, data)
                        shardedWriteOccurred = true
                    } else {
                        // normal write.
                        Kernel.world.setDynamicProperty(key, serialized)
                    }
                } catch (error) {
                    console.error(`[DatabaseManager] FLUSH_FAILURE for '${key}': ${error}`)
                }
            }
        }

        // Run ghost purge if we sharded something
        if (shardedWriteOccurred && !this.isPurgingGhosts) {
            this.isPurgingGhosts = true
            Kernel.system.runJob(this.ghostCleanupGenerator())
        }
    }

    // ----------------------------------------------------------------------------
    // | method: shardAndWrite                                                    |
    // | the sharding protocol. splits large payloads into versions buffers.      |
    // | uses a double-buffering strategy (v1/v2) for atomic commits.             |
    // ----------------------------------------------------------------------------
    shardAndWrite(key, data) {
        // serialize the data once.
        const serialized = JSON.stringify(data)
        const chars = Array.from(serialized)
        const shards = []
        const charLimit = Math.floor(this.MAX_PROPERTY_SIZE / 2) // safe character count for multi-byte UTF-8
        
        // cut the string into safe character-based pieces.
        for (let i = 0; i < chars.length; i += charLimit) {
            shards.push(chars.slice(i, i + charLimit).join(""))
        }

        // check which version is currently active so we can write to the other one.
        const currentIndexData = Kernel.world.getDynamicProperty(`${key}:shard_index`)
        let nextVersion = "v1"
        if (typeof currentIndexData === "string") {
            try {
                const currentIndex = JSON.parse(currentIndexData)
                nextVersion = currentIndex.version === "v1" ? "v2" : "v1"
            } catch (e) { /* fallback to v1 */ }
        }

        // step 1: write all segments to the inactive buffer.
        for (let i = 0; i < shards.length; i++) {
            Kernel.world.setDynamicProperty(`${key}:shard_${nextVersion}_${i}`, shards[i])
        }

        // step 2: update the index to point to the new version.
        Kernel.world.setDynamicProperty(`${key}:shard_index`, JSON.stringify({
            shardCount: shards.length,
            timestamp: Date.now(),
            version: nextVersion
        }))
        
        console.log(`[DatabaseManager] SHARDING_COMPLETE: '${key}' [${nextVersion}] split into ${shards.length} segments.`);
    }

    // ----------------------------------------------------------------------------
    // | method: loadSharded                                                      |
    // | reads sharded data and reconstructs the original string.                 |
    // ----------------------------------------------------------------------------
    loadSharded(key) {
        try {
            // get the index metadata.
            const indexData = Kernel.world.getDynamicProperty(`${key}:shard_index`)
            if (!indexData) return null

            const index = typeof indexData === "string" ? JSON.parse(indexData) : null
            if (!index || !index.version) return null
            
            const shards = []
            const version = index.version

            // fetch each slice in order.
            for (let i = 0; i < index.shardCount; i++) {
                const shard = Kernel.world.getDynamicProperty(`${key}:shard_${version}_${i}`)
                // if any slice is missing, the whole thing is corrupt.
                if (typeof shard !== "string") {
                    console.error(`[DatabaseManager] CRITICAL_INTEGRITY_FAILURE: Shard ${i} [${version}] missing for '${key}'`)
                    return null
                }
                shards.push(shard)
            }

            // join the shards and parse the json.
            return JSON.parse(shards.join(''))
        } catch (error) {
            console.error(`[DatabaseManager] SHARD_LOAD_FAILURE for '${key}': ${error}`)
            return null
        }
    }

    // ----------------------------------------------------------------------------
    // | method: ghostCleanupGenerator                                            |
    // | INDUSTRIAL_GHOST_PURGE_VECTOR                                            |
    // | Scans the dynamic property registry for superseded sharded versions.     |
    // | If a newer equivalent (v2) is confirmed in the index, the older version  |
    // | (v1) is terminated with extreme prejudice.                               |
    // ----------------------------------------------------------------------------
    *ghostCleanupGenerator() {
        const allIds = Kernel.world.getDynamicPropertyIds();
        const processedBases = new Set();

        for (let i = 0; i < allIds.length; i++) {
            // Yield every 50 properties to keep TPS at 20.0 kinda
            if (i % 50 === 0) yield;

            const id = allIds[i];
            if (!id.endsWith(":shard_index")) continue;

            const baseKey = id.replace(":shard_index", "");
            if (processedBases.has(baseKey)) continue;
            processedBases.add(baseKey);

            const indexRaw = Kernel.world.getDynamicProperty(id);
            if (typeof indexRaw !== "string") continue;
            
            let index;
            try {
                index = JSON.parse(indexRaw);
            } catch (e) {
                continue;
            }
            
            const activeVersion = index.version; // e.g., "v2"
            if (!activeVersion) continue;
            
            const deadVersion = activeVersion === "v1" ? "v2" : "v1";

            /* 
             * REALITY_SWEEP
             * Find all shards belonging to the DEAD version and nuke them.
             */
            const searchPattern = `${baseKey}:shard_${deadVersion}_`;
            for (const shardId of allIds) {
                if (shardId.startsWith(searchPattern)) {
                    // Double check index did not change mid-yield
                    const currentIndexRaw = Kernel.world.getDynamicProperty(id);
                    if (typeof currentIndexRaw === "string") {
                        try {
                            const curIndex = JSON.parse(currentIndexRaw);
                            if (curIndex.version === deadVersion) {
                                // If the current active version has switched to deadVersion, DO NOT delete it!
                                continue;
                            }
                        } catch {}
                    }
                    Kernel.world.setDynamicProperty(shardId, undefined);
                }
            }
        }
        console.log("[AethelOS] GHOST_PURGE_COMPLETE | Registry Stabilized.");
        this.isPurgingGhosts = false;
    }

    // ----------------------------------------------------------------------------
    // | method: flushAll                                                         |
    // | immediate write of all dirty keys. used during shutdown.                 |
    // ----------------------------------------------------------------------------
    flushAll() {
        this.flushDirty()
    }

    isProtectedKey(key) {
        if (!key) return false
        const lowerKey = key.toLowerCase()
        return (
            lowerKey.startsWith("ae:settings") ||
            lowerKey.startsWith("settings") ||
            lowerKey.endsWith(":index") ||
            lowerKey.startsWith("ae:ranks") ||
            lowerKey.startsWith("ae:warps") ||
            lowerKey.startsWith("ae:claims") ||
            lowerKey.includes("rank:") ||
            lowerKey.includes("warp:") ||
            lowerKey.includes("claim:")
        )
    }

    // ----------------------------------------------------------------------------
    // | method: cleanupExpiredData                                               |
    // | purges the memory cache to prevent the heap from exploding.              |
    // | keeps dirty keys so we don't lose unsaved changes.                       |
    // ----------------------------------------------------------------------------
    cleanupExpiredData() {
        // if the cache is getting too big (1000 entries).
        if (this.cache.size > 1000) {
            // iterate and delete old entries directly to avoid massive array copies.
            // we keep anything that is dirty (unsaved) regardless of age.
            let count = 0;
            const targetSize = 500;
            const toDelete = this.cache.size - targetSize;
            
            for (const [key, _value] of this.cache) {
                if (count >= toDelete) break;
                // Do not evict if it is a dirty key or a protected configuration key
                if (!this.dirtyKeys.has(key) && !this.isProtectedKey(key)) {
                    this.cache.delete(key);
                    count++;
                }
            }
        }
    }

    // ----------------------------------------------------------------------------
    // | method: getStats                                                         |
    // | monitoring helper.                                                       |
    // ----------------------------------------------------------------------------
    getStats() {
        return {
            cacheSize: this.cache.size,
            dirtyKeys: this.dirtyKeys.size,
            transactionQueues: this.transactionQueues.size
        }
    }

    /**
     * Writes a WAL entry to persistent world storage synchronously.
     */
    writeWal(senderId, receiverId, amount, senderOriginalBalance, receiverOriginalBalance) {
        const walEntry = {
            senderId,
            receiverId,
            amount,
            senderOriginalBalance,
            receiverOriginalBalance,
            timestamp: Date.now()
        };
        Kernel.world.setDynamicProperty("ae:wal", JSON.stringify(walEntry));
    }

    /**
     * Clears the WAL entry.
     */
    clearWal() {
        Kernel.world.setDynamicProperty("ae:wal", undefined);
    }

    /**
     * Scans the persistent world storage for unresolved transactions and recovers/rolls them back.
     */
    async resolvePendingWal() {
        try {
            const rawWal = Kernel.world.getDynamicProperty("ae:wal");
            if (typeof rawWal !== "string") return;

            console.warn(`[DatabaseManager] [WAL] Unresolved write-ahead log entry found! Recovering...`);
            const wal = JSON.parse(rawWal);
            if (!wal || !wal.senderId || !wal.receiverId || !wal.amount) {
                Kernel.world.setDynamicProperty("ae:wal", undefined);
                return;
            }

            const PlayerStore = Kernel.get("playerStore");
            const StoreKeys = Kernel.get("keys");
            if (!PlayerStore || !StoreKeys) {
                console.error(`[DatabaseManager] [WAL] PlayerStore or StoreKeys not available during WAL recovery!`);
                return;
            }

            const sender = { id: wal.senderId };
            const receiver = { id: wal.receiverId };
            const amount = wal.amount;

            const senderBalanceKey = StoreKeys.money(sender.id);
            const receiverBalanceKey = StoreKeys.money(receiver.id);

            const currentSenderBalance = PlayerStore.get(sender, senderBalanceKey) ?? 1000;
            const currentReceiverBalance = PlayerStore.get(receiver, receiverBalanceKey) ?? 1000;

            console.log(`[DatabaseManager] [WAL] Sender '${sender.id}' current balance: ${currentSenderBalance} (expected original: ${wal.senderOriginalBalance})`);
            console.log(`[DatabaseManager] [WAL] Receiver '${receiver.id}' current balance: ${currentReceiverBalance} (expected original: ${wal.receiverOriginalBalance})`);

            if (currentSenderBalance === wal.senderOriginalBalance - amount && currentReceiverBalance === wal.receiverOriginalBalance) {
                console.warn(`[DatabaseManager] [WAL] Transaction was partially completed (sender debited but receiver not credited). Rolling back...`);
                PlayerStore.set(sender, senderBalanceKey, wal.senderOriginalBalance);
                
                const { JournaledDb } = await import("./JournaledDatabase.js");
                JournaledDb.flush();
                this.flushDirty();
            } else if (currentSenderBalance === wal.senderOriginalBalance - amount && currentReceiverBalance === wal.receiverOriginalBalance + amount) {
                console.log(`[DatabaseManager] [WAL] Transaction was fully completed. Clearing log.`);
            } else if (currentSenderBalance === wal.senderOriginalBalance && currentReceiverBalance === wal.receiverOriginalBalance) {
                console.log(`[DatabaseManager] [WAL] Transaction had not started. Clearing log.`);
            } else {
                console.warn(`[DatabaseManager] [WAL] Mismatched state detected. Performing full rollback to original balances.`);
                PlayerStore.set(sender, senderBalanceKey, wal.senderOriginalBalance);
                PlayerStore.set(receiver, receiverBalanceKey, wal.receiverOriginalBalance);
                
                const { JournaledDb } = await import("./JournaledDatabase.js");
                JournaledDb.flush();
                this.flushDirty();
            }

            Kernel.world.setDynamicProperty("ae:wal", undefined);
            console.log(`[DatabaseManager] [WAL] Recovery complete and WAL cleared.`);
        } catch (error) {
            console.error(`[DatabaseManager] [WAL] Error during recovery process: ${error}`);
        }
    }

    /**
     * One-time background migration to parse historical data and build indexes.
     */
    async runOneTimeIndexMigration() {
        try {
            const isMigrated = this.get("ae:index_migrated")
            if (isMigrated) return

            console.warn("[DatabaseManager] [Migration] Running one-time database index migration...");
            const allIds = Kernel.world.getDynamicPropertyIds()
            
            const playerIndex = new Set()
            const namePattern = /^player:(.+):name$/
            const msgPattern = /^audit:msg:(.+)$/

            for (let i = 0; i < allIds.length; i++) {
                // Yield periodically to prevent blocking the tick
                if (i % 100 === 0) {
                    await new Promise(resolve => Kernel.system.run(resolve))
                }

                const propId = allIds[i]
                
                // 1. Process player name mapping & UUID register
                const nameMatch = propId.match(namePattern)
                if (nameMatch) {
                    const uuid = nameMatch[1]
                    const name = this.get(propId)
                    if (typeof name === "string" && name.trim().length > 0) {
                        this.set(`playername:${name.toLowerCase()}`, uuid)
                        playerIndex.add(uuid)
                    }
                }

                // 2. Process conversation message keys
                const msgMatch = propId.match(msgPattern)
                if (msgMatch) {
                    const pairId = msgMatch[1]
                    const parts = pairId.split("_")
                    if (parts.length === 2) {
                        const [idA, idB] = parts
                        
                        const convsA = this.get(`audit:convs:${idA}`) || []
                        if (!convsA.includes(idB)) {
                            convsA.push(idB)
                            this.set(`audit:convs:${idA}`, convsA)
                        }
                        
                        const convsB = this.get(`audit:convs:${idB}`) || []
                        if (!convsB.includes(idA)) {
                            convsB.push(idA)
                            this.set(`audit:convs:${idB}`, convsB)
                        }
                    }
                }
            }

            // Save player ledger index
            if (playerIndex.size > 0) {
                const existingIndex = this.get("ae:player_index") || []
                const mergedIndex = Array.from(new Set([...existingIndex, ...playerIndex]))
                this.set("ae:player_index", mergedIndex)
            }

            this.set("ae:index_migrated", true)
            this.flushDirty()
            console.warn("[DatabaseManager] [Migration] Database index migration completed successfully!");
        } catch (error) {
            console.error(`[DatabaseManager] [Migration] Index migration failed: ${error}`)
        }
    }
}

// export the singleton instance.
export const Database = new DatabaseManager()
