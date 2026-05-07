import { Kernel } from "../Kernel.js"

/**
 * Manages persistent data using dynamic properties.
 * Uses a cache-aside strategy and debounced writes to keep things fast.
 * Supports sharding for data that exceeds the 32KB limit.
 */
export class DatabaseManager {
    constructor() {
        this.cache = new Map() // In-memory data cache
        this.dirtyKeys = new Set() // Keys waiting to be saved
        this.writeTimeout = null
        this.WRITE_DELAY = 5000 // Delay between writes to save performance
        this.MAX_PROPERTY_SIZE = 30000 // Limit for a single property
        this.SHARD_SIZE = 50 
        
        this.transactionQueues = new Map() 
        
        this.initialize()
    }

    /**
     * Setup periodic cleanup and flush on shutdown
     */
    initialize() {
        Kernel.system.runInterval(() => {
            this.cleanupExpiredData()
        }, 20 * 60 * 20) 
        
        Kernel.system.beforeEvents.shutdown.subscribe(() => {
            this.flushAll()
        })
    }

    /*
     * BUFFERED_QUERY_PIPELINE
     * Attempts an O(1) cache-hit before falling back to the persistent 
     * storage layer.
     */
    get(key) {
        if (this.cache.has(key)) {
            return this.cache.get(key)
        }

        const data = this.loadFromStorage(key)
        if (data !== null) {
            this.cache.set(key, data)
        }
        return data
    }

    /*
     * BUFFERED_COMMIT_PROTOCOL
     * Updates the volatile buffer and schedules a debounced persistent 
     * write operation.
     */
    set(key, value) {
        try {
            this.cache.set(key, value)
            this.dirtyKeys.add(key)
            this.scheduleWrite()
            return true
        } catch (error) {
            console.error(`[DatabaseManager] COMMIT_FAILURE for '${key}': ${error}`)
            return false
        }
    }

    /*
     * PERSISTENT_DECOMMISSION_PROTOCOL
     */
    delete(key) {
        try {
            this.cache.delete(key)
            this.dirtyKeys.delete(key)
            Kernel.world.setDynamicProperty(key, undefined)
            return true
        } catch (error) {
            console.error(`[DatabaseManager] DECOMMISSION_FAILURE for '${key}': ${error}`)
            return false
        }
    }

    /*
     * SHARDED_COLLECTION_QUERY
     */
    getSharded(collectionName, itemId = null) {
        if (itemId) {
            return this.get(`${collectionName}:item:${itemId}`)
        }

        const indexKey = `${collectionName}:index`
        const index = this.get(indexKey) || []
        
        const collection = []
        for (const itemId of index) {
            const item = this.get(`${collectionName}:item:${itemId}`)
            if (item) {
                collection.push(item)
            }
        }
        
        return collection
    }

    /*
     * SHARDED_COLLECTION_COMMIT
     */
    setSharded(collectionName, itemId, data) {
        try {
            this.set(`${collectionName}:item:${itemId}`, data)
            
            const indexKey = `${collectionName}:index`
            const index = this.get(indexKey) || []
            
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

    /*
     * SHARDED_COLLECTION_DECOMMISSION
     */
    deleteSharded(collectionName, itemId) {
        try {
            const key = `${collectionName}:item:${itemId}`
            
            // 🚨 NUKE THE ORPHANS BEFORE POINTER DELETION
            const indexData = Kernel.world.getDynamicProperty(`${key}:shard_index`)
            if (typeof indexData === "string") {
                try {
                    const index = JSON.parse(indexData)
                    for (let i = 0; i < index.shardCount; i++) {
                        Kernel.world.setDynamicProperty(`${key}:shard_${index.version}_${i}`, undefined)
                    }
                    Kernel.world.setDynamicProperty(`${key}:shard_index`, undefined)
                } catch (e) {
                    console.error(`[DatabaseManager] ORPHAN_NUKE_FAILURE for '${key}': ${e}`)
                }
            }
            
            this.delete(key)
            
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

    /*
     * ATOMIC_TRANSACTION_PIPELINE
     * Orchestrates sequential execution of operations on specific entity 
     * identifiers to prevent state-corruption and credit-duplication.
     */
    async transaction(playerId, operation) {
        if (!this.transactionQueues.has(playerId)) {
            this.transactionQueues.set(playerId, Promise.resolve())
        }

        const queue = this.transactionQueues.get(playerId)
        
        const newOperation = queue.then(async () => {
            try {
                return await operation()
            } catch (error) {
                console.error(`[DatabaseManager] TRANSACTION_COLLAPSE for '${playerId}': ${error}`)
                throw error
            }
        })

        this.transactionQueues.set(playerId, newOperation)
        
        newOperation.finally(() => {
            if (this.transactionQueues.get(playerId) === newOperation) {
                this.transactionQueues.delete(playerId)
            }
        })

        return newOperation
    }

    /* 
     * LOW_LEVEL_READ_PROTOCOL
     */
    loadFromStorage(key) {
        try {
            // Priority 1: Check for sharded pointer manifest
            const indexKey = `${key}:shard_index`
            if (Kernel.world.getDynamicProperty(indexKey)) {
                return this.loadSharded(key)
            }

            // Priority 2: Standard resolution
            const raw = Kernel.world.getDynamicProperty(key)
            return typeof raw === "string" ? JSON.parse(raw) : null
        } catch (error) {
            console.error(`[DatabaseManager] RETRIEVAL_FAILURE for '${key}': ${error}`)
            return null
        }
    }

    /*
     * WRITE_DEBOUNCE_SCHEDULER
     */
    scheduleWrite() {
        if (this.writeTimeout) {
            Kernel.system.clearRun(this.writeTimeout)
        }

        this.writeTimeout = Kernel.system.runTimeout(() => {
            this.flushDirty()
        }, Math.max(1, Math.floor(this.WRITE_DELAY / 50)))
    }

    /*
     * DIRTY_BUFFER_COMMIT_PROTOCOL
     * Flushes the pending manifest to persistent storage. Triggers the 
     * sharding-protocol if the data-payload exceeds the native threshold.
     */
    flushDirty() {
        const keysToWrite = Array.from(this.dirtyKeys)
        this.dirtyKeys.clear()

        for (const key of keysToWrite) {
            if (this.cache.has(key)) {
                try {
                    const data = this.cache.get(key)
                    const serialized = JSON.stringify(data)
                    
                    if (serialized.length > this.MAX_PROPERTY_SIZE) {
                        this.shardAndWrite(key, data)
                    } else {
                        Kernel.world.setDynamicProperty(key, serialized)
                    }
                } catch (error) {
                    console.error(`[DatabaseManager] FLUSH_FAILURE for '${key}': ${error}`)
                }
            }
        }
    }

    /*
     * MULTI-SHARD_COMMIT_PROTOCOL (ATOMIC_VERSIONING)
     * ----------------------------------------------------------------------------
     * Splits monolithic payloads into segmented shards. Uses a double-buffering 
     * strategy (v1/v2) to ensure that a crash during the write-loop does not 
     * corrupt the existing dataset. The index is updated LAST as an atomic commit.
     */
    shardAndWrite(key, data) {
        const serialized = JSON.stringify(data)
        const shards = []
        
        for (let i = 0; i < serialized.length; i += this.MAX_PROPERTY_SIZE) {
            shards.push(serialized.slice(i, i + this.MAX_PROPERTY_SIZE))
        }

        // Resolve current version to determine the target buffer
        const currentIndexData = Kernel.world.getDynamicProperty(`${key}:shard_index`)
        let nextVersion = "v1"
        if (typeof currentIndexData === "string") {
            try {
                const currentIndex = JSON.parse(currentIndexData)
                nextVersion = currentIndex.version === "v1" ? "v2" : "v1"
            } catch (e) { /* Fallback to v1 */ }
        }

        // Step 1: Write all shards to the INACTIVE buffer
        for (let i = 0; i < shards.length; i++) {
            Kernel.world.setDynamicProperty(`${key}:shard_${nextVersion}_${i}`, shards[i])
        }

        // Step 2: Atomic Commit - Update the index to point to the new buffer
        Kernel.world.setDynamicProperty(`${key}:shard_index`, JSON.stringify({
            shardCount: shards.length,
            timestamp: Date.now(),
            version: nextVersion
        }))

        // Step 3: Cleanup (Optional/Deferred) - Prune old shards if they exist
        // Note: In high-performance scenarios, we leave cleanup to a background task
        
        console.log(`[DatabaseManager] SHARDING_COMPLETE: '${key}' [${nextVersion}] split into ${shards.length} segments.`);
    }

    /*
     * SHARD_RECONSTRUCTION_PIPELINE (ATOMIC_RESOLUTION)
     */
    loadSharded(key) {
        try {
            const indexData = Kernel.world.getDynamicProperty(`${key}:shard_index`)
            if (!indexData) return null

            const index = typeof indexData === "string" ? JSON.parse(indexData) : null
            if (!index || !index.version) return null
            
            const shards = []
            const version = index.version

            for (let i = 0; i < index.shardCount; i++) {
                const shard = Kernel.world.getDynamicProperty(`${key}:shard_${version}_${i}`)
                if (typeof shard !== "string") {
                    console.error(`[DatabaseManager] CRITICAL_INTEGRITY_FAILURE: Shard ${i} [${version}] missing or invalid for '${key}'`)
                    return null
                }
                shards.push(shard)
            }

            return JSON.parse(shards.join(''))
        } catch (error) {
            console.error(`[DatabaseManager] SHARD_LOAD_FAILURE for '${key}': ${error}`)
            return null
        }
    }

    /*
     * EMERGENCY_FLUSH_PROTOCOL
     */
    flushAll() {
        this.flushDirty()
    }

    /*
     * MAINTENANCE_CLEANUP_PROTOCOL
     * Prunes the volatile access-buffer to maintain a healthy memory-heap.
     */
    cleanupExpiredData() {
        if (this.cache.size > 1000) {
            const entries = Array.from(this.cache.entries())
            const toKeep = new Map()

            // Keep the most recent 500
            for (const [key, value] of entries.slice(-500)) {
                toKeep.set(key, value)
            }

            // Must keep dirty keys
            for (const [key, value] of entries) {
                if (this.dirtyKeys.has(key)) {
                    toKeep.set(key, value)
                }
            }

            this.cache = toKeep
        }
    }

    getStats() {
        return {
            cacheSize: this.cache.size,
            dirtyKeys: this.dirtyKeys.size,
            transactionQueues: this.transactionQueues.size
        }
    }
}

export const Database = new DatabaseManager()


