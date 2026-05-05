/*
 * INDUSTRIAL_SIGNAL_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-performance, O(1) event-emitter implementation for zero-coupling 
 * communication between disparate industrial modules. 
 *
 * PHILOSOPHY: Modules must remain decoupled. Emit signals into the bus; 
 * do not call remote methods directly. This prevents dependency-lock and 
 * architectural collapse.
 */
class SignalBus {
    /* 
     * GLOBAL_LISTENER_REGISTRY
     * O(1) Map storing arrays of execution-closures indexed by signal-id.
     */
    static #listeners = new Map()

    /*
     * SIGNAL_SUBSCRIPTION_PROTOCOL
     * Binds a closure to a specific signal identifier. Returns an 
     * unsubscription-vector for clean memory-heap management.
     */
    static on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, [])
        }
        
        this.#listeners.get(event).push(callback)
        
        return () => this.off(event, callback)
    }

    /*
     * SIGNAL_DE-REGISTRATION_PROTOCOL
     */
    static off(event, callback) {
        const listeners = this.#listeners.get(event)
        if (!listeners) return false
        
        const index = listeners.indexOf(callback)
        if (index === -1) return false
        
        listeners.splice(index, 1)
        return true
    }

    /*
     * SIGNAL_BROADCAST_PIPELINE
     * Iterates through all registered listeners and executes their 
     * closures. Each vector is wrapped in an isolation-block to prevent 
     * upstream module-crash from contaminating the bus.
     */
    static emit(event, ...args) {
        const listeners = this.#listeners.get(event)
        if (!listeners) return
        
        for (const callback of listeners) {
            try {
                callback(...args)
            } catch (error) {
                console.error(`[SignalBus] EXECUTION_COLLAPSE for signal '${event}': ${error}`);
            }
        }
    }

    /*
     * ATOMIC_SIGNAL_CAPTURE
     * Executes the closure once and immediately terminates the subscription.
     */
    static once(event, callback) {
        const onceCallback = (...args) => {
            this.off(event, onceCallback)
            callback(...args)
        }
        
        return this.on(event, onceCallback)
    }

    /*
     * REGISTRY_PURGE_PROTOCOL
     */
    static clear(event) {
        if (event) {
            this.#listeners.delete(event)
        } else {
            this.#listeners.clear()
        }
    }

    /*
     * METRIC_ACCESS_VECTOR
     */
    static listenerCount(event) {
        const listeners = this.#listeners.get(event)
        return listeners ? listeners.length : 0
    }
}

export { SignalBus }
