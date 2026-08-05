import { Kernel } from "../Kernel.js";

// TickScheduler: orchestrates tick-based task execution with rate-limiting, backoff, and telemetry.
export class TickScheduler {
    // Registry of currently active tasks mapped by unique identifier
    static #tasks = new Map();
    // Unique identifier generator counter
    static #nextId = 0;
    // Internal flag indicating if scheduler is active
    static #isRunning = true;

    static get isRunning() { return TickScheduler.#isRunning; }
    static set isRunning(val) { TickScheduler.#isRunning = val; }
    static get running() { return TickScheduler.#isRunning; }
    static set running(val) { TickScheduler.#isRunning = val; }

    // Telemetry statistics for global scheduler profiling
    static #stats = {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0
    };
    // Circular buffer for tracking task execution times (using Uint32Array for integer millisecond times)
    static #executionTimes = new Uint32Array(500);
    // Index position in circular execution times buffer
    static #executionIndex = 0;
    // Number of recorded execution times in buffer
    static #executionCount = 0;
    // Sum of execution times currently in the circular buffer
    static #executionSum = 0;

    /**
     * Schedules a recurring task in the tick orchestrator.
     * 
     * EXPECTS:
     * - callback: Function to be executed on interval ticks.
     * - intervalTicks: Positive integer representing the tick interval.
     * - options: Optional object containing configuration overrides.
     * 
     * GUARANTEES:
     * - Registers the task in the active registry and starts its interval execution.
     * - Respects execution limits (maxPerSecond) and condition checks if provided.
     * - Updates execution telemetry on successful or failed executions.
     * - Handles error retries and cancels the task if stopOnError/isStopOnError is true and maxRetries is exceeded.
     * - Returns a unique task ID (number).
     * 
     * DOES NOT PROMISE:
     * - Exact millisecond timing synchronization due to native tick jitter.
     * 
     * @param {Function} callback - The callback function to execute.
     * @param {number} intervalTicks - The interval in ticks.
     * @param {Object} [options={}] - Configuration options.
     * @returns {number} The scheduled task identifier.
     */
    static schedule(callback, intervalTicks, options = {}) {
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function.");
        }
        if (!Number.isInteger(intervalTicks) || intervalTicks <= 0) {
            throw new TypeError("intervalTicks must be a positive integer.");
        }

        const id = ++TickScheduler.#nextId;
        let lastRun = 0;
        
        const isStopOnError = (options.isStopOnError !== undefined ? options.isStopOnError : options.stopOnError) || false;
        
        const task = {
            id,
            callback,
            intervalTicks,
            options: {
                condition: options.condition || (() => true),
                maxPerSecond: options.maxPerSecond || null,
                isStopOnError,
                get stopOnError() { return this.isStopOnError; },
                set stopOnError(val) { this.isStopOnError = val; },
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
            isRunning: true,
            get running() { return this.isRunning; },
            set running(val) { this.isRunning = val; },
            isTimeout: false,
            get timeout() { return this.isTimeout; },
            set timeout(val) { this.isTimeout = val; }
        };
        
        const ta = Kernel.system.runInterval(() => {
            if (!TickScheduler.#isRunning || !task.isRunning) return;
            
            let conditionPassed = false;
            try {
                conditionPassed = task.options.condition();
            } catch (error) {
                console.error(`[TickScheduler] Condition check failed for task ${task.options.name}:`, error);
                return;
            }
            if (!conditionPassed) return;
            
            if (task.options.maxPerSecond) {
                const now = Date.now();
                if (now < lastRun) {
                    lastRun = 0; // NTP clock rollback recovery
                }
                if (now - lastRun < (1000 / task.options.maxPerSecond)) return;
                lastRun = now;
            }
            
            const startTime = Date.now();
            try {
                const res = callback();
                if (res instanceof Promise) {
                    res.then(() => {
                        const executionTime = Math.max(0, Date.now() - startTime);
                        TickScheduler.#updateTaskStats(task, executionTime, false);
                        task.retries = 0;
                    }).catch((error) => {
                        const executionTime = Math.max(0, Date.now() - startTime);
                        TickScheduler.#updateTaskStats(task, executionTime, true, error);
                        if (task.retries < task.options.maxRetries) {
                            task.retries++;
                        } else {
                            if (task.options.isStopOnError) TickScheduler.cancel(id);
                        }
                    });
                } else {
                    const executionTime = Math.max(0, Date.now() - startTime);
                    TickScheduler.#updateTaskStats(task, executionTime, false);
                    task.retries = 0;
                }
            } catch (error) {
                const executionTime = Math.max(0, Date.now() - startTime);
                TickScheduler.#updateTaskStats(task, executionTime, true, error);
                if (task.retries < task.options.maxRetries) {
                    task.retries++;
                } else {
                    if (task.options.isStopOnError) TickScheduler.cancel(id);
                }
            }
        }, intervalTicks);
        
        task.ta = ta;
        TickScheduler.#tasks.set(id, task);
        TickScheduler.#stats.totalTasks++;
        TickScheduler.#stats.activeTasks++;
        
        return id;
    }
    
    /**
     * Schedules a task with exponential backoff on failure.
     * Uses one-shot timeouts for each execution phase to avoid interval duplicate leaks.
     * 
     * EXPECTS:
     * - callback: Asynchronous or synchronous function that may throw/reject.
     * - initialDelay: Positive number representing the starting delay in milliseconds.
     * - maxDelay: Positive number representing the maximum delay in milliseconds.
     * - options: Optional configuration object.
     * 
     * GUARANTEES:
     * - Executes the callback and scales the delay exponentially up to maxDelay on failure.
     * - Resets the delay to initialDelay on a successful execution.
     * - Schedules the callback recurringly if options.recurring or options.isRecurring is true.
     * - Returns the task identifier.
     * 
     * DOES NOT PROMISE:
     * - Immediate cancellation of pending timeout steps when parent task is cancelled.
     * 
     * @param {Function} callback - The callback function to execute.
     * @param {number} initialDelay - Initial delay in milliseconds.
     * @param {number} maxDelay - Maximum delay in milliseconds.
     * @param {Object} [options={}] - Configuration options.
     * @returns {number} The task identifier.
     */
    static scheduleWithBackoff(callback, initialDelay, maxDelay, options = {}) {
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function.");
        }
        if (typeof initialDelay !== "number" || initialDelay <= 0) {
            throw new TypeError("initialDelay must be a positive number.");
        }
        if (typeof maxDelay !== "number" || maxDelay < initialDelay) {
            throw new TypeError("maxDelay must be a number greater than or equal to initialDelay.");
        }

        const id = ++TickScheduler.#nextId;
        let delay = initialDelay;
        
        const isRecurring = (options.isRecurring !== undefined ? options.isRecurring : options.recurring) || false;
        
        const task = {
            id,
            callback,
            options: {
                ...options,
                name: options.name || `BACKOFF_${id}`
            },
            stats: { executions: 0, errors: 0, lastExecution: 0, averageTime: 0, totalExecutionTime: 0 },
            isRunning: true,
            get running() { return this.isRunning; },
            set running(val) { this.isRunning = val; },
            isTimeout: false,
            get timeout() { return this.isTimeout; },
            set timeout(val) { this.isTimeout = val; },
            ta: null
        };

        const run = async () => {
            if (!task.isRunning) return;
            
            // Defuse pause silencing: if paused, check again in 20 ticks (1s) without running callback
            if (!TickScheduler.#isRunning) {
                task.ta = Kernel.system.runTimeout(run, 20);
                return;
            }

            const startTime = Date.now();
            try {
                const res = callback();
                if (res instanceof Promise) {
                    await res;
                }
                const executionTime = Math.max(0, Date.now() - startTime);
                TickScheduler.#updateTaskStats(task, executionTime, false);
                delay = initialDelay;
                
                if (isRecurring && task.isRunning) {
                    task.ta = Kernel.system.runTimeout(run, Math.max(1, Math.floor(delay / 50)));
                } else {
                    TickScheduler.#tasks.delete(id);
                    TickScheduler.#stats.activeTasks--;
                    TickScheduler.#stats.completedTasks++;
                }
            } catch (error) {
                const executionTime = Math.max(0, Date.now() - startTime);
                TickScheduler.#updateTaskStats(task, executionTime, true, error);
                
                delay = Math.min(delay * 2, maxDelay);
                if (task.isRunning) {
                    task.ta = Kernel.system.runTimeout(run, Math.max(1, Math.floor(delay / 50)));
                } else {
                    TickScheduler.#tasks.delete(id);
                    TickScheduler.#stats.activeTasks--;
                    TickScheduler.#stats.failedTasks++;
                }
            }
        };

        // Start execution sequence using a runTimeout and save the handle to task.ta
        task.ta = Kernel.system.runTimeout(run, Math.max(1, Math.floor(initialDelay / 50)));
        
        TickScheduler.#tasks.set(id, task);
        TickScheduler.#stats.totalTasks++;
        TickScheduler.#stats.activeTasks++;
        
        return id;
    }
    
    /**
     * Schedules a one-time execution timeout vector.
     * 
     * EXPECTS:
     * - callback: Function to be executed after the delay.
     * - delayTicks: Positive integer representing ticks to wait.
     * - options: Optional configuration object.
     * 
     * GUARANTEES:
     * - Executes the callback exactly once after the specified ticks.
     * - Removes the task from the registry and updates telemetry upon completion or failure.
     * - Returns a unique task ID (number).
     * 
     * DOES NOT PROMISE:
     * - Execution if the scheduler is paused globally at the timeout moment.
     * 
     * @param {Function} callback - The callback function to execute.
     * @param {number} delayTicks - Delay in ticks.
     * @param {Object} [options={}] - Configuration options.
     * @returns {number} The task identifier.
     */
    static scheduleTimeout(callback, delayTicks, options = {}) {
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function.");
        }
        if (!Number.isInteger(delayTicks) || delayTicks <= 0) {
            throw new TypeError("delayTicks must be a positive integer.");
        }

        const id = ++TickScheduler.#nextId;
        
        const isStopOnError = (options.isStopOnError !== undefined ? options.isStopOnError : options.stopOnError) || false;
        
        const task = {
            id,
            callback,
            options: {
                ...options,
                name: options.name || `TIMEOUT_${id}`,
                isStopOnError,
                get stopOnError() { return this.isStopOnError; },
                set stopOnError(val) { this.isStopOnError = val; }
            },
            stats: { executions: 0, errors: 0, lastExecution: 0, averageTime: 0, totalExecutionTime: 0 },
            isRunning: true,
            get running() { return this.isRunning; },
            set running(val) { this.isRunning = val; },
            isTimeout: true,
            get timeout() { return this.isTimeout; },
            set timeout(val) { this.isTimeout = val; }
        };
        
        const run = () => {
            if (!task.isRunning) return;

            // Defuse pause silencing: if paused, check again in 20 ticks (1s) without executing or deleting
            if (!TickScheduler.#isRunning) {
                task.ta = Kernel.system.runTimeout(run, 20);
                return;
            }

            const startTime = Date.now();
            try {
                const res = callback();
                if (res instanceof Promise) {
                    res.then(() => {
                        const executionTime = Math.max(0, Date.now() - startTime);
                        TickScheduler.#updateTaskStats(task, executionTime, false);
                        TickScheduler.#tasks.delete(id);
                        TickScheduler.#stats.activeTasks--;
                        TickScheduler.#stats.completedTasks++;
                    }).catch((error) => {
                        const executionTime = Math.max(0, Date.now() - startTime);
                        TickScheduler.#updateTaskStats(task, executionTime, true, error);
                        TickScheduler.#tasks.delete(id);
                        TickScheduler.#stats.activeTasks--;
                        TickScheduler.#stats.failedTasks++;
                    });
                } else {
                    const executionTime = Math.max(0, Date.now() - startTime);
                    TickScheduler.#updateTaskStats(task, executionTime, false);
                    TickScheduler.#tasks.delete(id);
                    TickScheduler.#stats.activeTasks--;
                    TickScheduler.#stats.completedTasks++;
                }
            } catch (error) {
                const executionTime = Math.max(0, Date.now() - startTime);
                TickScheduler.#updateTaskStats(task, executionTime, true, error);
                TickScheduler.#tasks.delete(id);
                TickScheduler.#stats.activeTasks--;
                TickScheduler.#stats.failedTasks++;
            }
        };

        const ta = Kernel.system.runTimeout(run, delayTicks);
        
        task.ta = ta;
        TickScheduler.#tasks.set(id, task);
        TickScheduler.#stats.totalTasks++;
        TickScheduler.#stats.activeTasks++;
        
        return id;
    }
    
    /**
     * Cancels a scheduled task and cleans up its native handle.
     * 
     * EXPECTS:
     * - id: Number identifier of the target task.
     * 
     * GUARANTEES:
     * - Clears the native run handle for the task.
     * - Removes the task from the registry and decrements active tasks.
     * - Returns true if task was found and cancelled, false otherwise.
     * 
     * DOES NOT PROMISE:
     * - Retaining task telemetry stats in getActiveTasks after deletion.
     * 
     * @param {number} id - The task identifier to cancel.
     * @returns {boolean} True if successfully cancelled, false otherwise.
     */
    static cancel(id) {
        const task = TickScheduler.#tasks.get(id);
        if (!task) return false;
        task.isRunning = false;
        Kernel.system.clearRun(task.ta);
        TickScheduler.#tasks.delete(id);
        TickScheduler.#stats.activeTasks--;
        TickScheduler.#stats.completedTasks++;
        return true;
    }
    
    /**
     * Pauses the global temporal execution of all scheduled tasks.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Prevents execution of any tasks under the scheduler's control until resumed.
     * 
     * DOES NOT PROMISE:
     * - Pausing of native timers directly; callbacks are discarded at execution boundary.
     */
    static pause() {
        TickScheduler.#isRunning = false;
    }

    /**
     * Resumes the global temporal execution of all scheduled tasks.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Enables execution of all tasks under the scheduler's control.
     * 
     * DOES NOT PROMISE:
     * - Compensation or catching up of missed ticks/intervals during the paused state.
     */
    static resume() {
        TickScheduler.#isRunning = true;
    }
    
    /**
     * Cancels and purges all currently active tasks.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Clears all native handles and purges all tasks from the registry.
     * - Resets the active task count to 0.
     * 
     * DOES NOT PROMISE:
     * - Resetting of stats metrics such as totalTasks, completedTasks, or failedTasks.
     */
    static cancelAll() {
        for (const [_id, task] of TickScheduler.#tasks) {
            task.isRunning = false;
            Kernel.system.clearRun(task.ta);
        }
        TickScheduler.#tasks.clear();
        TickScheduler.#stats.activeTasks = 0;
    }
    
    /**
     * Updates telemetry metrics for a task execution.
     * 
     * EXPECTS:
     * - task: Object containing telemetry stats structure.
     * - executionTime: Number representing execution duration.
     * - error: Boolean indicating if an error occurred.
     * - _errorObj: Optional error object details.
     * 
     * GUARANTEES:
     * - Recalculates individual task average and total execution times.
     * - Updates global scheduler performance stats via circular buffer sum.
     * - Maintains circular buffer bounds strictly.
     * 
     * DOES NOT PROMISE:
     * - Detailed stack trace storage for consecutive errors.
     * 
     * @param {Object} task - The task object.
     * @param {number} executionTime - Execution duration in milliseconds.
     * @param {boolean} error - Whether execution failed.
     * @param {Object} [_errorObj=null] - Optional error details.
     * @private
     */
    static #updateTaskStats(task, executionTime, error, _errorObj = null) {
        task.stats.executions++;
        task.stats.lastExecution = Date.now();
        task.stats.totalExecutionTime += executionTime;
        task.stats.averageTime = task.stats.totalExecutionTime / task.stats.executions;
        
        if (error) {
            task.stats.errors++;
            TickScheduler.#stats.failedTasks++;
        }
        
        // Update circular buffer and sum for O(1) average calculation
        if (TickScheduler.#executionCount === TickScheduler.#executionTimes.length) {
            TickScheduler.#executionSum -= TickScheduler.#executionTimes[TickScheduler.#executionIndex];
        } else {
            TickScheduler.#executionCount++;
        }
        
        TickScheduler.#executionTimes[TickScheduler.#executionIndex] = executionTime;
        TickScheduler.#executionSum += executionTime;
        TickScheduler.#executionIndex = (TickScheduler.#executionIndex + 1) % TickScheduler.#executionTimes.length;
        
        TickScheduler.#stats.averageExecutionTime = TickScheduler.#executionCount > 0 ? TickScheduler.#executionSum / TickScheduler.#executionCount : 0;
    }
    
    /**
     * Retrieves a snapshot array of all active tasks.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Returns an array of task representations containing metadata and current telemetry.
     * - Supports both old and new boolean property names for backward compatibility.
     * 
     * DOES NOT PROMISE:
     * - Live updates to the returned snapshot objects.
     * 
     * @returns {Object[]} List of active task metadata objects.
     */
    static getActiveTasks() {
        return Array.from(TickScheduler.#tasks.values()).map(task => ({
            id: task.id,
            name: task.options.name,
            intervalTicks: task.intervalTicks,
            isRunning: task.isRunning,
            running: task.isRunning,
            stats: { ...task.stats },
            retries: task.retries,
            isTimeout: task.isTimeout || false,
            timeout: task.isTimeout || false
        }));
    }
    
    /**
     * Retrieves global scheduler telemetry metrics.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Returns global statistics including total, active, completed, and failed tasks.
     * - Returns average execution time rounded to the nearest integer.
     * - Exposes running/isRunning flags indicating global execution state.
     * 
     * DOES NOT PROMISE:
     * - Realtime synchronization across ticks while an update callback is executing.
     * 
     * @returns {Object} Global telemetry statistics.
     */
    static getStats() {
        return {
            ...TickScheduler.#stats,
            averageExecutionTime: Math.round(TickScheduler.#stats.averageExecutionTime),
            isRunning: TickScheduler.#isRunning,
            running: TickScheduler.#isRunning,
            executionTimes: TickScheduler.#executionCount
        };
    }
}

// Pre-configured industrial schedulers for common periodic procedures
export const CommonSchedulers = {
    scheduleBroadcast: (callback, intervalSeconds = 120) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "BROADCAST_VECTOR",
            maxRetries: 3,
            condition: () => Kernel.world.getAllPlayers().length > 0
        });
    },
    
    scheduleCleanup: (callback, intervalMinutes = 20) => {
        return TickScheduler.schedule(callback, 20 * 60 * intervalMinutes, {
            name: "MAINTENANCE_PURGE",
            maxRetries: 2,
            priority: -1 
        });
    },
    
    scheduleCacheInvalidation: (callback, intervalSeconds = 5) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "CACHE_TERMINATION",
            maxPerSecond: 10,
            maxRetries: 1
        });
    },
    
    schedulePlayerUpdates: (callback, intervalSeconds = 10) => {
        return TickScheduler.schedule(callback, 20 * intervalSeconds, {
            name: "ENTITY_STATE_SYNC",
            condition: () => Kernel.world.getAllPlayers().length > 0,
            maxRetries: 2
        });
    }
};
