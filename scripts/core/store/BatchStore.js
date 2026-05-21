import { Kernel } from "../Kernel.js"

/**
 * Collects and flushes database operations in batches.
 * This reduces the overhead of frequent writes and JSON serialization.
 */
export class BatchStore {
    static #batches = new Map() // Operations waiting to be flushed
    static #flushTimeouts = new Map() // Debounce timers
    static #DEFAULT_DELAY = 100 // Wait time before flushing
    static #MAX_BATCH_SIZE = 50 // Max ops before forced flush
    static #stats = {
        totalOperations: 0,
        totalBatches: 0,
        totalFlushes: 0,
        averageBatchSize: 0
    }
    
    /**
     * Initialize a new batch for a specific store
     */
    static startBatch(storeName) {
        if (!this.#batches.has(storeName)) {
            this.#batches.set(storeName, new Map())
        }
    }
    
    /*
     * OPERATION_QUEUE_VECTOR
     * ----------------------------------------------------------------------------
     * Injects a data operation into the batch buffer. If the buffer size 
     * reaches the MAX_BATCH_SIZE threshold, it triggers an immediate 
     * flush to maintain system stability.
     */
    static queue(storeName, key, value, options = {}) {
        let batch = this.#batches.get(storeName)
        if (!batch) {
            batch = new Map()
            this.#batches.set(storeName, batch)
        }
        
        batch.set(key, {
            value,
            timestamp: Date.now(),
            priority: options.priority || 0,
            operation: options.operation || 'set'
        })
        
        this.#stats.totalOperations++
        
        if (batch.size >= this.#MAX_BATCH_SIZE) {
            this.#flush(storeName)
        } else {
            this.#scheduleFlush(storeName)
        }
    }
    
    static queuePlayer(player, key, value, options = {}) {
        this.queue('players', `${player.id}:${key}`, value, options)
    }
    
    static queueWorld(key, value, options = {}) {
        this.queue('world', key, value, options)
    }
    
    /*
     * DEBOUNCED_FLUSH_SCHEDULER
     */
    static #scheduleFlush(storeName) {
        if (this.#flushTimeouts.has(storeName)) return
        
        const timeout = Kernel.system.runTimeout(() => {
            this.#flush(storeName)
        }, Math.max(1, Math.floor(this.#DEFAULT_DELAY / 50))) 
        
        this.#flushTimeouts.set(storeName, timeout)
    }
    
    /*
     * TRANSACTION_COMMIT_LOOP
     * ----------------------------------------------------------------------------
     * Resolves the pending batch buffer. Operations are sorted by priority 
     * (highest first) and timestamp (earliest first) to ensure deterministic 
     * execution order.
     */
    static async #flush(storeName) {
        const batch = this.#batches.get(storeName)
        if (!batch || batch.size === 0) return
        
        this.#flushTimeouts.delete(storeName)
        this.#batches.delete(storeName)
        
        const operations = Array.from(batch.entries())
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority 
                }
                return a.timestamp - b.timestamp 
            })
        
        this.#stats.totalBatches++
        this.#stats.totalFlushes++
        this.#stats.averageBatchSize = Math.round(this.#stats.totalOperations / this.#stats.totalBatches)
        
        try {
            await this.#executeBatch(operations, storeName)
            
            Kernel.system.run(() => {
                console.log(`[BatchStore] FLUSH_COMPLETE | Store: ${storeName} | Ops: ${operations.length}`);
            })
            
        } catch (error) {
            console.error(`[BatchStore] FATAL_FLUSH_ERROR for ${storeName}:`, error)
            
            /* 
             * RECOVERY_PROTOCOL
             * If a high-priority operation fails, we re-queue it to prevent 
             * catastrophic data loss.
             */
            if (operations.some(op => op.priority >= 10)) {
                operations.forEach(op => {
                    if (op.priority >= 10) {
                        this.queue(storeName, op.key, op.value, { priority: op.priority })
                    }
                })
            }
        }
    }
    
    /*
     * BATCH_ROUTING_ENGINE
     * ----------------------------------------------------------------------------
     * Decouples player-specific operations from global-world operations. 
     * This allows for targeted execution in the respective stores.
     */
    static async #executeBatch(operations, _storeName) {
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
        
        if (playerOps.length > 0) {
            await this.#executePlayerBatch(playerOps)
        }
        
        if (worldOps.length > 0) {
            await this.#executeWorldBatch(worldOps)
        }
    }
    
    /*
     * PLAYER_TRANSACTION_LOOP
     * ----------------------------------------------------------------------------
     * Bypasses the journaled buffer completely to execute safe, direct database writes.
     * Writes directly to the persistent Database layer to eliminate circular latency.
     */
    static async #executePlayerBatch(operations) {
        const playerGroups = new Map()
        const Database = Kernel.get("database") // FIX: Query raw database instead of store proxies
        
        operations.forEach(op => {
            if (!playerGroups.has(op.playerId)) {
                playerGroups.set(op.playerId, [])
            }
            playerGroups.get(op.playerId).push(op)
        })
        
        for (const [playerId, playerOps] of playerGroups) {
            try {
                for (const op of playerOps) {
                    const fullKey = `player:${playerId}:${op.key}`
                    if (op.operation === 'delete') {
                        Database.delete(fullKey)
                    } else {
                        Database.set(fullKey, op.value)
                    }
                }
            } catch (error) {
                console.error(`[BatchStore] PLAYER_BATCH_FAILURE for ${playerId}:`, error)
            }
        }
    }
    
    /* 
     * WORLD_TRANSACTION_LOOP
     */
    static async #executeWorldBatch(operations) {
        const Database = Kernel.get("database") // FIX: Query raw database instead of store proxies
        for (const op of operations) {
            try {
                if (op.operation === 'delete') {
                    Database.delete(op.key)
                } else {
                    Database.set(op.key, op.value)
                }
            } catch (error) {
                console.error(`[BatchStore] WORLD_BATCH_FAILURE for ${op.key}:`, error)
            }
        }
    }
    
    /* 
     * EMERGENCY_FLUSH_PROTOCOL
     */
    static async flushAll() {
        const storeNames = Array.from(this.#batches.keys())
        const flushPromises = storeNames.map(storeName => this.#flush(storeName))
        
        await Promise.allSettled(flushPromises)
        
        for (const timeout of this.#flushTimeouts.values()) {
            Kernel.system.clearRun(timeout)
        }
        this.#flushTimeouts.clear()
    }
    
    /* 
     * ANALYTICS_ACCESSOR
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
    
    static resetStats() {
        this.#stats = {
            totalOperations: 0,
            totalBatches: 0,
            totalFlushes: 0,
            averageBatchSize: 0
        }
    }
    
    static getPendingOperations(storeName) {
        const batch = this.#batches.get(storeName)
        if (!batch) return []
        
        return Array.from(batch.entries())
            .map(([key, data]) => ({ key, ...data }))
    }
    
    /* 
     * BATCH_TERMINATION_PROTOCOL
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
            Kernel.system.clearRun(timeout)
            this.#flushTimeouts.delete(storeName)
        }
        
        return cancelled
    }
    
    static hasPending(storeName) {
        const batch = this.#batches.get(storeName)
        return batch && batch.size > 0
    }
    
    static getPendingStores() {
        return Array.from(this.#batches.keys()).filter(name => this.hasPending(name))
    }
    
    /* 
     * PARAMETER_CALIBRATION
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

/* 
 * SHUTDOWN_SAFETY_HOOK
 * Ensures all pending transactions are committed before the server process 
 * terminates.
 */
Kernel.system.beforeEvents.startup.subscribe((ev) => {
    Kernel.system.beforeEvents.shutdown.subscribe(() => {
        BatchStore.flushAll()
    })
})

