/**
 * Tick Scheduler - Advanced Task Scheduling with Rate Limiting and Backoff
 * Provides efficient tick-based task execution with performance monitoring
 */

import { system } from "@minecraft/server"

export class TickScheduler {
    static #tasks = new Map()
    static #nextId = 0
    static #running = true
    static #stats = {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0
    }
    static #executionTimes = []
    
    /**
     * Schedule a recurring task
     * @param {Function} callback - Task function
     * @param {number} intervalTicks - Interval in ticks (20 ticks = 1 second)
     * @param {Object} options - Task options
     * @returns {number} Task ID
     */
    static schedule(callback, intervalTicks, options = {}) {
        const id = ++this.#nextId
        let lastRun = 0
        let ticksAccumulated = 0
        let executionCount = 0
        
        const task = {
            id,
            callback,
            intervalTicks,
            options: {
                condition: options.condition || (() => true),
                maxPerSecond: options.maxPerSecond || null,
                stopOnError: options.stopOnError || false,
                priority: options.priority || 0,
                name: options.name || `Task-${id}`,
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
        
        const taskId = system.runInterval(() => {
            if (!this.#running || !task.running) return
            
            // Check condition
            if (!task.options.condition()) return
            
            // Rate limiting
            if (task.options.maxPerSecond) {
                const now = Date.now()
                if (now - lastRun < (1000 / task.options.maxPerSecond)) {
                    return
                }
                lastRun = now
            }
            
            // Execute task with timing
            const startTime = Date.now()
            
            try {
                callback()
                const executionTime = Date.now() - startTime
                this.#updateTaskStats(task, executionTime, false)
                task.retries = 0 // Reset retries on success
            } catch (error) {
                const executionTime = Date.now() - startTime
                this.#updateTaskStats(task, executionTime, true, error)
                
                // Handle retries
                if (task.retries < task.options.maxRetries) {
                    task.retries++
                    console.warn(`Scheduler task ${task.options.name} failed (attempt ${task.retries}/${task.options.maxRetries}): ${error.message}`)
                    
                    // Schedule retry with delay
                    system.runTimeout(() => {
                        if (task.running) {
                            try {
                                callback()
                                this.#updateTaskStats(task, 0, false)
                                task.retries = 0
                            } catch (retryError) {
                                this.#updateTaskStats(task, 0, true, retryError)
                            }
                        }
                    }, Math.max(1, Math.floor((task.options.retryDelay * task.retries) / 50)))
                } else {
                    console.error(`Scheduler task ${task.options.name} failed permanently after ${task.options.maxRetries} retries:`, error)
                    
                    if (task.options.stopOnError) {
                        this.cancel(id)
                    }
                }
            }
        }, intervalTicks)
        
        task.taskId = taskId
        this.#tasks.set(id, task)
        this.#stats.totalTasks++
        this.#stats.activeTasks++
        
        return id
    }
    
    /**
     * Schedule a task with exponential backoff
     * @param {Function} callback - Task function
     * @param {number} initialDelay - Initial delay in ms
     * @param {number} maxDelay - Maximum delay in ms
     * @param {Object} options - Additional options
     * @returns {number} Task ID
     */
    static scheduleWithBackoff(callback, initialDelay, maxDelay, options = {}) {
        let delay = initialDelay
        let failures = 0
        
        const run = async () => {
            try {
                await callback()
                failures = 0
                delay = initialDelay
                
                // Schedule next run
                if (options.recurring) {
                    this.schedule(run, Math.floor(delay / 50), options) // Convert ms to ticks
                }
            } catch (error) {
                failures++
                delay = Math.min(delay * 2, maxDelay)
                console.warn(`Backoff task failed (${failures}), retrying in ${delay}ms: ${error.message}`)
                
                // Schedule retry
                system.runTimeout(run, Math.max(1, Math.floor(delay / 50)))
            }
        }
        
        return this.schedule(run, Math.floor(initialDelay / 50), options)
    }
    
    /**
     * Schedule a single-use task (timeout)
     * @param {Function} callback - Task function
     * @param {number} delayTicks - Delay in ticks
     * @param {Object} options - Task options
     * @returns {number} Task ID
     */
    static scheduleTimeout(callback, delayTicks, options = {}) {
        const id = ++this.#nextId
        
        const task = {
            id,
            callback,
            options: {
                ...options,
                name: options.name || `Timeout-${id}`
            },
            stats: {
                executions: 0,
                errors: 0,
                lastExecution: 0,
                averageTime: 0,
                totalExecutionTime: 0
            },
            running: true,
            timeout: true
        }
        
        const taskId = system.runTimeout(() => {
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
                
                if (!options.stopOnError) {
                    this.#tasks.delete(id)
                }
            }
        }, delayTicks)
        
        task.taskId = taskId
        this.#tasks.set(id, task)
        this.#stats.totalTasks++
        this.#stats.activeTasks++
        
        return id
    }
    
    /**
     * Cancel a scheduled task
     * @param {number} id - Task ID
     * @returns {boolean} Whether task was cancelled
     */
    static cancel(id) {
        const task = this.#tasks.get(id)
        if (!task) return false
        
        task.running = false
        
        if (task.timeout) {
            system.clearRun(task.taskId)
        } else {
            system.clearRun(task.taskId)
        }
        
        this.#tasks.delete(id)
        this.#stats.activeTasks--
        this.#stats.completedTasks++
        
        return true
    }
    
    /**
     * Pause all tasks
     */
    static pause() {
        this.#running = false
    }
    
    /**
     * Resume all tasks
     */
    static resume() {
        this.#running = true
    }
    
    /**
     * Cancel all tasks
     */
    static cancelAll() {
        for (const [id, task] of this.#tasks) {
            task.running = false
            
            if (task.timeout) {
                system.clearRun(task.taskId)
            } else {
                system.clearRun(task.taskId)
            }
        }
        
        this.#tasks.clear()
        this.#stats.activeTasks = 0
    }
    
    /**
     * Get task information
     * @param {number} id - Task ID
     * @returns {Object} Task information
     */
    static getTask(id) {
        const task = this.#tasks.get(id)
        if (!task) return null
        
        return {
            id: task.id,
            name: task.options.name,
            intervalTicks: task.intervalTicks,
            running: task.running,
            stats: { ...task.stats },
            retries: task.retries,
            isTimeout: task.timeout || false
        }
    }
    
    /**
     * Get all active tasks
     * @returns {Array} Array of task information
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
    
    /**
     * Get scheduler statistics
     * @returns {Object} Statistics
     */
    static getStats() {
        const avgExecutionTime = this.#executionTimes.length > 0 ?
            this.#executionTimes.reduce((a, b) => a + b, 0) / this.#executionTimes.length : 0
        
        return {
            ...this.#stats,
            averageExecutionTime: Math.round(avgExecutionTime),
            running: this.#running,
            executionTimes: this.#executionTimes.length
        }
    }
    
    /**
     * Reset statistics
     */
    static resetStats() {
        this.#stats = {
            totalTasks: 0,
            activeTasks: this.#tasks.size,
            completedTasks: 0,
            failedTasks: 0,
            averageExecutionTime: 0
        }
        this.#executionTimes = []
        
        // Reset individual task stats
        for (const task of this.#tasks.values()) {
            task.stats = {
                executions: 0,
                errors: 0,
                lastExecution: 0,
                averageTime: 0,
                totalExecutionTime: 0
            }
        }
    }
    
    /**
     * Update task statistics
     * @param {Object} task - Task object
     * @param {number} executionTime - Execution time in ms
     * @param {boolean} error - Whether execution failed
     * @param {Error} errorObj - Error object if failed
     */
    static #updateTaskStats(task, executionTime, error, errorObj = null) {
        task.stats.executions++
        task.stats.lastExecution = Date.now()
        task.stats.totalExecutionTime += executionTime
        task.stats.averageTime = task.stats.totalExecutionTime / task.stats.executions
        
        if (error) {
            task.stats.errors++
            this.#stats.failedTasks++
        }
        
        // Track global execution times
        this.#executionTimes.push(executionTime)
        if (this.#executionTimes.length > 1000) {
            this.#executionTimes = this.#executionTimes.slice(-500) // Keep last 500
        }
        
        this.#stats.averageExecutionTime = this.#executionTimes.length > 0 ?
            this.#executionTimes.reduce((a, b) => a + b, 0) / this.#executionTimes.length : 0
    }
    
    /**
     * Find tasks by name pattern
     * @param {RegExp|string} pattern - Pattern to match
     * @returns {Array} Matching tasks
     */
    static findTasks(pattern) {
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)
        
        return this.getActiveTasks().filter(task => 
            regex.test(task.name)
        )
    }
    
    /**
     * Cancel tasks by name pattern
     * @param {RegExp|string} pattern - Pattern to match
     * @returns {number} Number of tasks cancelled
     */
    static cancelTasks(pattern) {
        const tasks = this.findTasks(pattern)
        let cancelled = 0
        
        for (const task of tasks) {
            if (this.cancel(task.id)) {
                cancelled++
            }
        }
        
        return cancelled
    }
}

// Pre-configured common schedulers
export const CommonSchedulers = {
    /**
     * Schedule broadcast messages
     * @param {Function} callback - Broadcast function
     * @param {number} intervalSeconds - Interval in seconds
     */
    scheduleBroadcast: (callback, intervalSeconds = 120) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "Broadcast",
            maxRetries: 3,
            condition: () => world.getPlayers().length > 0
        })
    },
    
    /**
     * Schedule cleanup tasks
     * @param {Function} callback - Cleanup function
     * @param {number} intervalMinutes - Interval in minutes
     */
    scheduleCleanup: (callback, intervalMinutes = 20) => {
        return TickScheduler.schedule(callback, 20 * 60 * intervalMinutes, {
            name: "Cleanup",
            maxRetries: 2,
            priority: -1 // Low priority
        })
    },
    
    /**
     * Schedule cache invalidation
     * @param {Function} callback - Cache invalidation function
     * @param {number} intervalSeconds - Interval in seconds
     */
    scheduleCacheInvalidation: (callback, intervalSeconds = 5) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "CacheInvalidation",
            maxPerSecond: 10, // Rate limit
            maxRetries: 1
        })
    },
    
    /**
     * Schedule player data updates
     * @param {Function} callback - Update function
     * @param {number} intervalSeconds - Interval in seconds
     */
    schedulePlayerUpdates: (callback, intervalSeconds = 10) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "PlayerUpdates",
            condition: () => world.getPlayers().length > 0,
            maxRetries: 2
        })
    }
}
