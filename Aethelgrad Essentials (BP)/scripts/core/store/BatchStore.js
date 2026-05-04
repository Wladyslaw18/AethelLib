/**
 * Batch Store - Optimized Database Operations with Batching
 * Reduces database calls by batching operations and using transactions
 */

import { WorldStore } from "../store/WorldStore.js"
import { PlayerStore } from "../store/PlayerStore.js"
import { system } from "@minecraft/server"

export class BatchStore {
    static #batches = new Map() // storeName -> Map of pending operations
    static #flushTimeouts = new Map() // storeName -> timeout ID
    static #DEFAULT_DELAY = 100 // 100ms default batch delay
    static #MAX_BATCH_SIZE = 50 // Maximum operations per batch
    static #stats = {
        totalOperations: 0,
        totalBatches: 0,
        totalFlushes: 0,
        averageBatchSize: 0
    }
    
    /**
     * Start batching for a specific store
     * @param {string} storeName - Store identifier
     */
    static startBatch(storeName) {
        if (!this.#batches.has(storeName)) {
            this.#batches.set(storeName, new Map())
        }
    }
    
    /**
     * Queue an operation for batching
     * @param {string} storeName - Store identifier
     * @param {string} key - Data key
     * @param {any} value - Data value
     * @param {Object} options - Operation options
     */
    static queue(storeName, key, value, options = {}) {
        let batch = this.#batches.get(storeName)
        if (!batch) {
            batch = new Map()
            this.#batches.set(storeName, batch)
        }
        
        // Store operation with metadata
        batch.set(key, {
            value,
            timestamp: Date.now(),
            priority: options.priority || 0,
            operation: options.operation || 'set'
        })
        
        this.#stats.totalOperations++
        
        // Schedule flush if batch is getting large
        if (batch.size >= this.#MAX_BATCH_SIZE) {
            this.#flush(storeName)
        } else {
            this.#scheduleFlush(storeName)
        }
    }
    
    /**
     * Queue a player-specific operation
     * @param {Player} player - Player object
     * @param {string} key - Data key
     * @param {any} value - Data value
     * @param {Object} options - Operation options
     */
    static queuePlayer(player, key, value, options = {}) {
        this.queue('players', `${player.id}:${key}`, value, options)
    }
    
    /**
     * Queue a world-specific operation
     * @param {string} key - Data key
     * @param {any} value - Data value
     * @param {Object} options - Operation options
     */
    static queueWorld(key, value, options = {}) {
        this.queue('world', key, value, options)
    }
    
    /**
     * Schedule batch flush with debounce
     * @param {string} storeName - Store identifier
     */
    static #scheduleFlush(storeName) {
        if (this.#flushTimeouts.has(storeName)) return
        
        const timeout = system.runTimeout(() => {
            this.#flush(storeName)
        }, Math.max(1, Math.floor(this.#DEFAULT_DELAY / 50))) // Convert ms to ticks (roughly)
        
        this.#flushTimeouts.set(storeName, timeout)
    }
    
    /**
     * Flush batched operations to database
     * @param {string} storeName - Store identifier
     * @returns {Promise} Flush completion
     */
    static async #flush(storeName) {
        const batch = this.#batches.get(storeName)
        if (!batch || batch.size === 0) return
        
        // Clear timeout and batch to prevent re-entry
        this.#flushTimeouts.delete(storeName)
        this.#batches.delete(storeName)
        
        // Sort operations by priority and timestamp
        const operations = Array.from(batch.entries())
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority // Higher priority first
                }
                return a.timestamp - b.timestamp // Earlier operations first
            })
        
        this.#stats.totalBatches++
        this.#stats.totalFlushes++
        this.#stats.averageBatchSize = Math.round(this.#stats.totalOperations / this.#stats.totalBatches)
        
        try {
            // Use transaction for atomic writes
            await this.#executeBatch(operations, storeName)
            
            // Emit batch complete event
            system.run(() => {
                console.log(`BatchStore: Flushed ${operations.length} operations for ${storeName}`)
            })
            
        } catch (error) {
            console.error(`BatchStore: Failed to flush ${storeName}:`, error)
            
            // Re-queue failed operations if critical
            if (operations.some(op => op.priority >= 10)) {
                operations.forEach(op => {
                    if (op.priority >= 10) {
                        this.queue(storeName, op.key, op.value, { priority: op.priority })
                    }
                })
            }
        }
    }
    
    /**
     * Execute batch of operations
     * @param {Array} operations - Operations to execute
     * @param {string} storeName - Store name
     */
    static async #executeBatch(operations, storeName) {
        // Separate player and world operations
        const playerOps = []
        const worldOps = []
        
        operations.forEach(op => {
            if (op.key.includes(':')) {
                const [playerId, ...keyParts] = op.key.split(':')
                playerOps.push({
                    playerId,
                    key: keyParts.join(':'),
                    value: op.value,
                    operation: op.operation
                })
            } else {
                worldOps.push(op)
            }
        })
        
        // Execute player operations in batches
        if (playerOps.length > 0) {
            await this.#executePlayerBatch(playerOps)
        }
        
        // Execute world operations
        if (worldOps.length > 0) {
            await this.#executeWorldBatch(worldOps)
        }
    }
    
    /**
     * Execute player batch operations
     * @param {Array} operations - Player operations
     */
    static async #executePlayerBatch(operations) {
        // Group by player for efficiency
        const playerGroups = new Map()
        
        operations.forEach(op => {
            if (!playerGroups.has(op.playerId)) {
                playerGroups.set(op.playerId, [])
            }
            playerGroups.get(op.playerId).push(op)
        })
        
        // Process each player's operations
        for (const [playerId, playerOps] of playerGroups) {
            try {
                // Find the player if online
                const player = world.getPlayers().find(p => p.id === playerId)
                
                if (player) {
                    // Execute operations for online player
                    for (const op of playerOps) {
                        if (op.operation === 'delete') {
                            PlayerStore.delete(player, op.key)
                        } else {
                            PlayerStore.set(player, op.key, op.value)
                        }
                    }
                } else {
                    // Player offline - use world store with player prefix
                    for (const op of playerOps) {
                        const fullKey = `player:${playerId}:${op.key}`
                        if (op.operation === 'delete') {
                            WorldStore.delete(fullKey)
                        } else {
                            WorldStore.set(fullKey, op.value)
                        }
                    }
                }
            } catch (error) {
                console.error(`BatchStore: Failed to execute player batch for ${playerId}:`, error)
            }
        }
    }
    
    /**
     * Execute world batch operations
     * @param {Array} operations - World operations
     */
    static async #executeWorldBatch(operations) {
        for (const op of operations) {
            try {
                if (op.operation === 'delete') {
                    WorldStore.delete(op.key)
                } else {
                    WorldStore.set(op.key, op.value)
                }
            } catch (error) {
                console.error(`BatchStore: Failed to execute world operation for ${op.key}:`, error)
            }
        }
    }
    
    /**
     * Force flush all pending batches
     * @returns {Promise} All flushes completed
     */
    static async flushAll() {
        const storeNames = Array.from(this.#batches.keys())
        const flushPromises = storeNames.map(storeName => this.#flush(storeName))
        
        await Promise.allSettled(flushPromises)
        
        // Clear all timeouts
        for (const timeout of this.#flushTimeouts.values()) {
            system.clearRun(timeout)
        }
        this.#flushTimeouts.clear()
    }
    
    /**
     * Get batch statistics
     * @returns {Object} Batch statistics
     */
    static getStats() {
        const pendingOperations = Array.from(this.#batches.values())
            .reduce((total, batch) => total + batch.size, 0)
        
        return {
            ...this.#stats,
            pendingOperations,
            activeBatches: this.#batches.size,
            pendingFlushes: this.#flushTimeouts.size
        }
    }
    
    /**
     * Reset statistics
     */
    static resetStats() {
        this.#stats = {
            totalOperations: 0,
            totalBatches: 0,
            totalFlushes: 0,
            averageBatchSize: 0
        }
    }
    
    /**
     * Get pending operations for a store
     * @param {string} storeName - Store name
     * @returns {Array} Pending operations
     */
    static getPendingOperations(storeName) {
        const batch = this.#batches.get(storeName)
        if (!batch) return []
        
        return Array.from(batch.entries())
            .map(([key, data]) => ({ key, ...data }))
    }
    
    /**
     * Cancel pending operations for a store
     * @param {string} storeName - Store name
     * @returns {number} Number of cancelled operations
     */
    static cancelBatch(storeName) {
        const batch = this.#batches.get(storeName)
        const timeout = this.#flushTimeouts.get(storeName)
        
        let cancelled = 0
        
        if (batch) {
            cancelled = batch.size
            batch.clear()
            this.#batches.delete(storeName)
        }
        
        if (timeout) {
            system.clearRun(timeout)
            this.#flushTimeouts.delete(storeName)
        }
        
        return cancelled
    }
    
    /**
     * Check if store has pending operations
     * @param {string} storeName - Store name
     * @returns {boolean} Whether store has pending operations
     */
    static hasPending(storeName) {
        const batch = this.#batches.get(storeName)
        return batch && batch.size > 0
    }
    
    /**
     * Get all store names with pending operations
     * @returns {Array} Store names
     */
    static getPendingStores() {
        return Array.from(this.#batches.keys()).filter(name => this.hasPending(name))
    }
    
    /**
     * Configure batch settings
     * @param {Object} config - Configuration options
     */
    static configure(config) {
        if (config.defaultDelay !== undefined) {
            this.#DEFAULT_DELAY = config.defaultDelay
        }
        if (config.maxBatchSize !== undefined) {
            this.#MAX_BATCH_SIZE = config.maxBatchSize
        }
    }
}

// Auto-flush on server shutdown if needed
system.beforeEvents.shutdown.subscribe(() => {
    BatchStore.flushAll()
})
