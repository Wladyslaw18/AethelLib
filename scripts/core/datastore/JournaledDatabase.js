import { Kernel } from "../Kernel.js";
import { Database } from "./DatabaseManager.js";

/**
 * Buffer-aside persistence layer.
 * Buffers updates in memory Map to minimize disk writes, flushing in batches.
 * Hardened with isolated transaction-key flushing to prevent state bleeds.
 */
class JournaledDatabase {
    /**
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Instantiates the journal Map for buffered key-value changes.
     * - Initializes the isDirty state to false.
     * - Subscribes to the shutdown event to prevent data loss on termination.
     * 
     * DOES NOT PROMISE:
     * - Immediate persistence of buffered keys on startup.
     */
    constructor() {
        this.journal = new Map();
        this.isDirty = false;
        this.flushIntervalId = null;

        // Register shutdown subscriber to prevent catastrophic data loss on termination
        Kernel.system.beforeEvents.shutdown.subscribe(() => {
            this.flush();
            Database.flushAll();
        });
    }

    /**
     * EXPECTS:
     * - key: A valid string identifier representing the database key.
     * 
     * GUARANTEES:
     * - Returns the value from the memory journal if the key is buffered.
     * - Falls back to calling the primary Database to fetch the value if not in the journal.
     * 
     * DOES NOT PROMISE:
     * - Cloning of object values; mutations to objects returned will directly affect the cache/journal.
     */
    get(key) {
        if (this.journal.has(key)) {
            return this.journal.get(key);
        }
        return Database.get(key);
    }

    /**
     * EXPECTS:
     * - key: A valid string identifier representing the database key.
     * - value: Any serializable value to store, or undefined/null.
     * 
     * GUARANTEES:
     * - Writes the value to the in-memory journal Map.
     * - Sets the isDirty property to true to trigger future flushes.
     * - Returns true.
     * 
     * DOES NOT PROMISE:
     * - Synchronous persistence to disk/storage.
     */
    set(key, value) {
        this.journal.set(key, value);
        this.isDirty = true;
        this.ensureFlushCycleStarted();
        return true;
    }

    /**
     * EXPECTS:
     * - key: A valid string identifier representing the database key to remove.
     * 
     * GUARANTEES:
     * - Sets the value of the key to undefined in the journal Map to mark it for deletion.
     * - Sets the isDirty property to true.
     * - Returns true.
     * 
     * DOES NOT PROMISE:
     * - Synchronous deletion in the persistent storage.
     */
    delete(key) {
        this.journal.set(key, undefined);
        this.isDirty = true;
        this.ensureFlushCycleStarted();
        return true;
    }

    /**
     * Flushes ONLY specific keys from the journal buffer.
     * Used to preserve player-isolation during transactions.
     * 
     * EXPECTS:
     * - keysToFlush: An iterable (Array or Set) of string keys to persist.
     * 
     * GUARANTEES:
     * - Synchronously transfers keys from the journal buffer to the primary database.
     * - Deletes the keys from the memory journal buffer after they are written.
     * - Correctly translates undefined values as deletions in the primary database.
     * - Prevents silent data loss by retaining keys in the journal if the database write fails.
     * 
     * DOES NOT PROMISE:
     * - Flushing of other keys not specified in the input iterable.
     */
    flushKeys(keysToFlush) {
        for (const key of keysToFlush) {
            if (this.journal.has(key)) {
                const value = this.journal.get(key);
                let isWriteSuccessful = false;
                if (value === undefined) {
                    isWriteSuccessful = Database.delete(key);
                } else {
                    isWriteSuccessful = Database.set(key, value);
                }
                
                if (isWriteSuccessful) {
                    this.journal.delete(key);
                } else {
                    console.error(`[Datastore] Flush failure for key '${key}', keeping in journal buffer.`);
                }
            }
        }
    }

    /**
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Short-circuits immediately if isDirty is false.
     * - Loops through all buffered journal entries and commits them to the primary database.
     * - Performs deletion in the primary database if value is undefined.
     * - Clears the journal Map and resets isDirty to false.
     * 
     * DOES NOT PROMISE:
     * - Safety from race conditions if journal entries are written while flushing.
     */
    flush() {
        if (!this.isDirty) return;

        for (const [key, value] of this.journal.entries()) {
            let isWriteSuccessful = false;
            if (value === undefined) {
                isWriteSuccessful = Database.delete(key);
            } else {
                isWriteSuccessful = Database.set(key, value);
            }
            if (isWriteSuccessful) {
                this.journal.delete(key);
            }
        }

        if (this.journal.size === 0) {
            this.isDirty = false;
        }
        console.log("[Datastore] JOURNAL_FLUSH_COMPLETE");
    }

    /**
     * EXPECTS:
     * - Kernel.system is initialized.
     * 
     * GUARANTEES:
     * - Sets up a recurring runInterval timer to call flush every 200 ticks (10 seconds) if not already running.
     */
    ensureFlushCycleStarted() {
        if (this.flushIntervalId) return;
        if (Kernel.system) {
            this.flushIntervalId = Kernel.system.runInterval(() => {
                this.flush();
            }, 200); // Flush every 10 seconds (200 ticks)
        }
    }

    /**
     * EXPECTS:
     * - playerId: A valid string player identifier.
     * - operation: An executable callback function representing a transactional work block.
     * 
     * GUARANTEES:
     * - Locks execution under Database.transaction(playerId) to prevent race conditions.
     * - Gathers player-specific buffered keys from the journal *inside* the lock.
     * - Flushes those keys inside the lock before running the operation callback.
     * - Implements an atomic rollback mechanism to restore the journal state on operation failure.
     * - Collects and flushes player-specific keys again after transaction completion.
     * - Returns the resulting value of the operation callback.
     * 
     * DOES NOT PROMISE:
     * - Isolation of keys that do not start with the standard player prefix format.
     */
    async transaction(playerId, operation) {
        const playerPrefix = `player:${playerId}:`;

        return Database.transaction(playerId, async () => {
            // 1. Flush player-specific keys *inside* the transaction queue lock, before running the operation
            const keysToIsolate = Array.from(this.journal.keys()).filter(key => key.startsWith(playerPrefix));
            this.flushKeys(keysToIsolate);

            // 2. Snapshot player's current journal state (typically empty after flushKeys, but recorded for rollback safety)
            const preOpSnapshot = new Map();
            for (const [key, value] of this.journal.entries()) {
                if (key.startsWith(playerPrefix)) {
                    preOpSnapshot.set(key, value);
                }
            }

            try {
                const result = await operation();

                // 3. Commit: flush player's keys *inside* the lock
                const postKeys = Array.from(this.journal.keys()).filter(key => key.startsWith(playerPrefix));
                this.flushKeys(postKeys);

                return result;
            } catch (error) {
                // 4. Rollback: revert player keys in journal back to pre-op snapshot
                for (const key of this.journal.keys()) {
                    if (key.startsWith(playerPrefix) && !preOpSnapshot.has(key)) {
                        this.journal.delete(key);
                    }
                }
                for (const [key, value] of preOpSnapshot.entries()) {
                    this.journal.set(key, value);
                }
                throw error;
            }
        });
    }

    /**
     * EXPECTS:
     * - collection: A valid string representation of the sharded collection name.
     * - id: A valid string representation of the item ID.
     * 
     * GUARANTEES:
     * - Delegates retrieval to the sharded retrieval API on the primary database.
     * 
     * DOES NOT PROMISE:
     * - Reflection of un-flushed sharded updates currently stored in the memory journal.
     */
    getSharded(collection, id) { return Database.getSharded(collection, id); }

    /**
     * EXPECTS:
     * - collection: A valid string representation of the sharded collection name.
     * - id: A valid string representation of the item ID.
     * - value: A serializable value to store.
     * 
     * GUARANTEES:
     * - Delegates storage to the sharded store API on the primary database.
     * 
     * DOES NOT PROMISE:
     * - Memory journaling bypass (this method writes directly to the primary database, skipping the memory journal).
     */
    setSharded(collection, id, value) { return Database.setSharded(collection, id, value); }

    /**
     * EXPECTS:
     * - collection: A valid string representation of the sharded collection name.
     * - id: A valid string representation of the item ID.
     * 
     * GUARANTEES:
     * - Delegates deletion to the sharded delete API on the primary database.
     * 
     * DOES NOT PROMISE:
     * - Memory journaling bypass (this method deletes directly in the primary database, skipping the memory journal).
     */
    deleteSharded(collection, id) { return Database.deleteSharded(collection, id); }

    /**
     * Calculates the approximate memory footprint of both the journal buffer and Database cache.
     * Optimized O(N) allocation-free calculation to prevent GC spikes and server lag.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Sums estimated size of keys and values in the journal Map and Database cache Map.
     * - Returns total estimated byte size.
     */
    getMemoryFootprint() {
        let total = 0;
        
        // Sum journal entries allocation-free
        for (const [key, value] of this.journal.entries()) {
            total += key.length * 2;
            if (value !== undefined && value !== null) {
                if (typeof value === "string") {
                    total += value.length * 2;
                } else if (typeof value === "number" || typeof value === "boolean") {
                    total += 8;
                } else {
                    total += 128; // basic object estimate
                }
            }
        }
        
        // Sum Database cache entries allocation-free
        for (const [key, value] of Database.cache.entries()) {
            total += key.length * 2;
            if (value !== undefined && value !== null) {
                if (typeof value === "string") {
                    total += value.length * 2;
                } else if (typeof value === "number" || typeof value === "boolean") {
                    total += 8;
                } else {
                    total += 128; // basic object estimate
                }
            }
        }
        return total;
    }
}

export const JournaledDb = new JournaledDatabase();
