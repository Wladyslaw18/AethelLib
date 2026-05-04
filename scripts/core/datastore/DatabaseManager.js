/**
 * DatabaseManager - High-performance data storage with caching and sharding
 * Implements Cache-Aside pattern with debounced writes and automatic sharding
 */

import { world, system } from "@minecraft/server"

export class DatabaseManager {
    constructor() {
        this.cache = new Map()
        this.dirtyKeys = new Set()
        this.writeTimeout = null
        this.WRITE_DELAY = 5000 // 5 seconds debounce
        this.MAX_PROPERTY_SIZE = 30000 // 30KB limit per property
        this.SHARD_SIZE = 50 // Items per shard for large collections
        
        // Transaction queues for atomic operations
        this.transactionQueues = new Map()
        
        this.initialize()
    }

    /**
     * Initialize the database manager
     */
    initialize() {
        // Schedule periodic cleanup
        system.runInterval(() => {
            this.cleanupExpiredData()
        }, 20 * 60 * 20) // Every 20 minutes
        
        // Handle shutdown gracefully
        system.beforeEvents.watchdogTerminate.subscribe(() => {
            this.flushAll()
        })
    }

    /**
     * Get data from cache or load from storage
     * @param {string} key - Data key
     * @returns {any} Cached data or null
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

    /**
     * Set data in cache and mark for write
     * @param {string} key - Data key
     * @param {any} value - Data value
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            this.cache.set(key, value)
            this.dirtyKeys.add(key)
            this.scheduleWrite()
            return true
        } catch (error) {
            console.error(`Failed to set ${key}: ${error}`)
            return false
        }
    }

    /**
     * Delete data from cache and storage
     * @param {string} key - Data key
     * @returns {boolean} Success status
     */
    delete(key) {
        try {
            this.cache.delete(key)
            this.dirtyKeys.delete(key)
            world.setDynamicProperty(key, undefined)
            return true
        } catch (error) {
            console.error(`Failed to delete ${key}: ${error}`)
            return false
        }
    }

    /**
     * Get sharded collection data
     * @param {string} collectionName - Name of the collection
     * @param {string} itemId - ID of the item (optional)
     * @returns {any} Item data or entire collection
     */
    getSharded(collectionName, itemId = null) {
        if (itemId) {
            return this.get(`${collectionName}:item:${itemId}`)
        }

        // Get collection index
        const indexKey = `${collectionName}:index`
        let index = this.get(indexKey) || []
        
        // Load all items from shards
        const collection = []
        for (const itemId of index) {
            const item = this.get(`${collectionName}:item:${itemId}`)
            if (item) {
                collection.push(item)
            }
        }
        
        return collection
    }

    /**
     * Set sharded collection data
     * @param {string} collectionName - Name of the collection
     * @param {string} itemId - ID of the item
     * @param {any} data - Item data
     * @returns {boolean} Success status
     */
    setSharded(collectionName, itemId, data) {
        try {
            // Set the item
            this.set(`${collectionName}:item:${itemId}`, data)
            
            // Update index
            const indexKey = `${collectionName}:index`
            let index = this.get(indexKey) || []
            
            if (!index.includes(itemId)) {
                index.push(itemId)
                this.set(indexKey, index)
            }
            
            return true
        } catch (error) {
            console.error(`Failed to set sharded data ${collectionName}:${itemId}: ${error}`)
            return false
        }
    }

    /**
     * Delete item from sharded collection
     * @param {string} collectionName - Name of the collection
     * @param {string} itemId - ID of the item
     * @returns {boolean} Success status
     */
    deleteSharded(collectionName, itemId) {
        try {
            // Delete the item
            this.delete(`${collectionName}:item:${itemId}`)
            
            // Update index
            const indexKey = `${collectionName}:index`
            let index = this.get(indexKey) || []
            index = index.filter(id => id !== itemId)
            this.set(indexKey, index)
            
            return true
        } catch (error) {
            console.error(`Failed to delete sharded data ${collectionName}:${itemId}: ${error}`)
            return false
        }
    }

    /**
     * Execute atomic transaction for player-specific data
     * @param {string} playerId - Player ID for transaction isolation
     * @param {Function} operation - Async operation to execute
     * @returns {Promise<any>} Operation result
     */
    async transaction(playerId, operation) {
        // Get or create queue for this player
        if (!this.transactionQueues.has(playerId)) {
            this.transactionQueues.set(playerId, Promise.resolve())
        }

        const queue = this.transactionQueues.get(playerId)
        
        const newOperation = queue.then(async () => {
            try {
                return await operation()
            } catch (error) {
                console.error(`Transaction failed for ${playerId}: ${error}`)
                throw error
            }
        })

        this.transactionQueues.set(playerId, newOperation)
        
        // Clean up queue after operation completes
        newOperation.finally(() => {
            if (this.transactionQueues.get(playerId) === newOperation) {
                this.transactionQueues.delete(playerId)
            }
        })

        return newOperation
    }

    /**
     * Load data from world dynamic properties
     * @param {string} key - Data key
     * @returns {any} Parsed data or null
     */
    loadFromStorage(key) {
        try {
            const raw = world.getDynamicProperty(key)
            return typeof raw === "string" ? JSON.parse(raw) : null
        } catch (error) {
            console.error(`Failed to load ${key}: ${error}`)
            return null
        }
    }

    /**
     * Schedule debounced write operation
     */
    scheduleWrite() {
        if (this.writeTimeout) {
            system.clearRun(this.writeTimeout)
        }

        this.writeTimeout = system.runTimeout(() => {
            this.flushDirty()
        }, Math.max(1, Math.floor(this.WRITE_DELAY / 50)))
    }

    /**
     * Write all dirty data to storage
     */
    flushDirty() {
        const keysToWrite = Array.from(this.dirtyKeys)
        this.dirtyKeys.clear()

        for (const key of keysToWrite) {
            if (this.cache.has(key)) {
                try {
                    const data = this.cache.get(key)
                    const serialized = JSON.stringify(data)
                    
                    // Check if data needs sharding
                    if (serialized.length > this.MAX_PROPERTY_SIZE) {
                        this.shardAndWrite(key, data)
                    } else {
                        world.setDynamicProperty(key, serialized)
                    }
                } catch (error) {
                    console.error(`Failed to write ${key}: ${error}`)
                }
            }
        }
    }

    /**
     * Shard large data and write to multiple properties
     * @param {string} key - Original key
     * @param {any} data - Data to shard
     */
    shardAndWrite(key, data) {
        const serialized = JSON.stringify(data)
        const shards = []
        
        // Split data into chunks
        for (let i = 0; i < serialized.length; i += this.MAX_PROPERTY_SIZE) {
            shards.push(serialized.slice(i, i + this.MAX_PROPERTY_SIZE))
        }

        // Write shard index
        world.setDynamicProperty(`${key}:shard_index`, JSON.stringify({
            shardCount: shards.length,
            timestamp: Date.now()
        }))

        // Write individual shards
        for (let i = 0; i < shards.length; i++) {
            world.setDynamicProperty(`${key}:shard_${i}`, shards[i])
        }

        console.log(`Sharded ${key} into ${shards.length} parts`)
    }

    /**
     * Load and reconstruct sharded data
     * @param {string} key - Original key
     * @returns {any} Reconstructed data or null
     */
    loadSharded(key) {
        try {
            const indexData = world.getDynamicProperty(`${key}:shard_index`)
            if (!indexData) return null

            const index = typeof indexData === "string" ? JSON.parse(indexData) : null
            if (!index) return null
            const shards = []

            for (let i = 0; i < index.shardCount; i++) {
                const shard = world.getDynamicProperty(`${key}:shard_${i}`)
                if (!shard) return null
                shards.push(shard)
            }

            return JSON.parse(shards.join(''))
        } catch (error) {
            console.error(`Failed to load sharded data ${key}: ${error}`)
            return null
        }
    }

    /**
     * Flush all cached data to storage
     */
    flushAll() {
        this.flushDirty()
    }

    /**
     * Clean up expired data and optimize cache
     */
    cleanupExpiredData() {
        // Remove expired transaction queues
        for (const [playerId, queue] of this.transactionQueues) {
            if (queue.status === 'fulfilled' || queue.status === 'rejected') {
                this.transactionQueues.delete(playerId)
            }
        }

        // Optional: Clear cache for less frequently accessed data
        if (this.cache.size > 1000) {
            const entries = Array.from(this.cache.entries())
            // Keep only the most recently accessed 500 items
            const toKeep = entries.slice(-500)
            this.cache.clear()
            for (const [key, value] of toKeep) {
                this.cache.set(key, value)
            }
        }
    }

    /**
     * Get database statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            dirtyKeys: this.dirtyKeys.size,
            transactionQueues: this.transactionQueues.size
        }
    }
}

// Singleton instance
export const Database = new DatabaseManager()

