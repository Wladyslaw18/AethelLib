import { Kernel } from "../Kernel.js";

/*
 * INDUSTRIAL_TICK_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * The temporal heartbeat of the AethelLib ecosystem. Orchestrates 
 * tick-based task execution with built-in rate-limiting, exponential 
 * backoff, and performance telemetry.
 *
 * PHILOSOPHY: Time is the scarcest resource. Every tick must be 
 * utilized with maximum efficiency. Use the priority-node to ensure 
 * critical tasks are never deferred.
 */
export class TickScheduler {
    static #tasks = new Map() // ACTIVE_TASK_REGISTRY
    static #nextId = 0
    static #running = true
    static #stats = {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0
    }
    static #executionTimes = new Float32Array(500) // TELEMETRY_CIRCULAR_BUFFER
    static #executionIndex = 0
    static #executionCount = 0
    static #executionSum = 0
    
    /* 
     * TASK_INJECTION_PROTOCOL
     * Schedules a recurring execution vector. Supports conditional 
     * gating and rate-limiting.
     */
    static schedule(callback, intervalTicks, options = {}) {
        const id = ++this.#nextId
        let lastRun = 0
        
        const task = {
            id,
            callback,
            intervalTicks,
            options: {
                condition: options.condition || (() => true),
                maxPerSecond: options.maxPerSecond || null,
                stopOnError: options.stopOnError || false,
                priority: options.priority || 0,
                name: options.name || `TASK_${id}`,
                maxRetries: options.maxRetries || 0,
                retryDelay: options.retryDelay || 1000
            },
            stats: {
                executions: 0,
                errors: 0,
                lastExecution: 0,
                averageTime: 0,
                totalExecutionTime: 0
            },
            retries: 0,
            running: true
        }
        
        const ta = Kernel.system.runInterval(() => {
            if (!this.#running || !task.running) return
            
            if (!task.options.condition()) return
            
            if (task.options.maxPerSecond) {
                const now = Date.now()
                if (now - lastRun < (1000 / task.options.maxPerSecond)) return
                lastRun = now
            }
            
            const startTime = Date.now()
            try {
                callback()
                const executionTime = Date.now() - startTime
                this.#updateTaskStats(task, executionTime, false)
                task.retries = 0 
            } catch (error) {
                const executionTime = Date.now() - startTime
                this.#updateTaskStats(task, executionTime, true, error)
                if (task.retries < task.options.maxRetries) {
                    task.retries++
                } else {
                    if (task.options.stopOnError) this.cancel(id)
                }
            }
        }, intervalTicks)
        
        task.ta = ta
        this.#tasks.set(id, task)
        this.#stats.totalTasks++
        this.#stats.activeTasks++
        
        return id
    }
    
    /* 
     * BACKOFF_ORCHESTRATION_PROTOCOL
     */
    static scheduleWithBackoff(callback, initialDelay, maxDelay, options = {}) {
        let delay = initialDelay
        let failures = 0
        
        const run = async () => {
            try {
                await callback()
                failures = 0
                delay = initialDelay
                if (options.recurring) this.schedule(run, Math.floor(delay / 50), options)
            } catch (error) {
                failures++
                delay = Math.min(delay * 2, maxDelay)
                Kernel.system.runTimeout(run, Math.max(1, Math.floor(delay / 50)))
            }
        }
        
        return this.schedule(run, Math.floor(initialDelay / 50), options)
    }
    
    /* 
     * SINGLE-USE_TIMEOUT_PROTOCOL
     */
    static scheduleTimeout(callback, delayTicks, options = {}) {
        const id = ++this.#nextId
        
        const task = {
            id,
            callback,
            options: { ...options, name: options.name || `TIMEOUT_${id}` },
            stats: { executions: 0, errors: 0, lastExecution: 0, averageTime: 0, totalExecutionTime: 0 },
            running: true,
            timeout: true
        }
        
        const ta = Kernel.system.runTimeout(() => {
            if (!this.#running || !task.running) return
            const startTime = Date.now()
            try {
                callback()
                const executionTime = Date.now() - startTime
                this.#updateTaskStats(task, executionTime, false)
                this.#tasks.delete(id)
                this.#stats.activeTasks--
                this.#stats.completedTasks++
            } catch (error) {
                const executionTime = Date.now() - startTime
                this.#updateTaskStats(task, executionTime, true, error)
                this.#stats.activeTasks--
                this.#stats.failedTasks++
                if (!options.stopOnError) this.#tasks.delete(id)
            }
        }, delayTicks)
        
        task.ta = ta
        this.#tasks.set(id, task)
        this.#stats.totalTasks++
        this.#stats.activeTasks++
        
        return id
    }
    
    /* 
     * TASK_DECOMMISSION_PROTOCOL
     */
    static cancel(id) {
        const task = this.#tasks.get(id)
        if (!task) return false
        task.running = false
        Kernel.system.clearRun(task.ta)
        this.#tasks.delete(id)
        this.#stats.activeTasks--
        this.#stats.completedTasks++
        return true
    }
    
    /* 
     * GLOBAL_TEMPORAL_HALT
     */
    static pause() { this.#running = false }
    static resume() { this.#running = true }
    
    static cancelAll() {
        for (const [_id, task] of this.#tasks) {
            task.running = false
            Kernel.system.clearRun(task.ta)
        }
        this.#tasks.clear()
        this.#stats.activeTasks = 0
    }
    
    /* 
     * TELEMETRY_PROTOCOL
     */
    static #updateTaskStats(task, executionTime, error, _errorObj = null) {
        task.stats.executions++
        task.stats.lastExecution = Date.now()
        task.stats.totalExecutionTime += executionTime
        task.stats.averageTime = task.stats.totalExecutionTime / task.stats.executions
        
        if (error) {
            task.stats.errors++
            this.#stats.failedTasks++
        }
        
        // update circular buffer and sum for O(1) average calculation
        if (this.#executionCount === this.#executionTimes.length) {
            this.#executionSum -= this.#executionTimes[this.#executionIndex]
        } else {
            this.#executionCount++
        }
        
        this.#executionTimes[this.#executionIndex] = executionTime
        this.#executionSum += executionTime
        this.#executionIndex = (this.#executionIndex + 1) % this.#executionTimes.length
        
        this.#stats.averageExecutionTime = this.#executionCount > 0 ? this.#executionSum / this.#executionCount : 0
    }
    
    /* 
     * TASK_QUERY_VECTORS
     */
    static getActiveTasks() {
        return Array.from(this.#tasks.values()).map(task => ({
            id: task.id,
            name: task.options.name,
            intervalTicks: task.intervalTicks,
            running: task.running,
            stats: { ...task.stats },
            retries: task.retries,
            isTimeout: task.timeout || false
        }))
    }
    
    static getStats() {
        return {
            ...this.#stats,
            averageExecutionTime: Math.round(this.#stats.averageExecutionTime),
            running: this.#running,
            executionTimes: this.#executionCount
        }
    }
}

/* 
 * PRE-CONFIGURED_INDUSTRIAL_SCHEDULERS
 */
export const CommonSchedulers = {
    scheduleBroadcast: (callback, intervalSeconds = 120) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "BROADCAST_VECTOR",
            maxRetries: 3,
            condition: () => Kernel.world.getAllPlayers().length > 0
        })
    },
    
    scheduleCleanup: (callback, intervalMinutes = 20) => {
        return TickScheduler.schedule(callback, 20 * 60 * intervalMinutes, {
            name: "MAINTENANCE_PURGE",
            maxRetries: 2,
            priority: -1 
        })
    },
    
    scheduleCacheInvalidation: (callback, intervalSeconds = 5) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "CACHE_TERMINATION",
            maxPerSecond: 10,
            maxRetries: 1
        })
    },
    
    schedulePlayerUpdates: (callback, intervalSeconds = 10) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "ENTITY_STATE_SYNC",
            condition: () => Kernel.world.getAllPlayers().length > 0,
            maxRetries: 2
        })
    }
}
