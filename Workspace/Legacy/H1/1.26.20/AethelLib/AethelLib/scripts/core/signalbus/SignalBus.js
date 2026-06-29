/**
 * Event bus for cross-module communication.
 * Allows modules to stay decoupled by using signals instead of direct calls.
 */
class SignalBus {
    // List of registered event listeners
    static #listeners = new Map()

    /**
     * Subscribe to an event
     */
    static on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, [])
        }
        
        this.#listeners.get(event).push(callback)
        
        return () => this.off(event, callback)
    }

    /*
     * Unsubscribe from an event
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
     * Emit a signal to all listeners
     */
    static emit(event, ...args) {
        const listeners = this.#listeners.get(event)
        if (!listeners) return
        
        for (const callback of listeners) {
            try {
                callback(...args)
            } catch (error) {
                console.error(`[SignalBus] Error in signal '${event}': ${error}`);
            }
        }
    }

    /*
     * Listen for a signal once
     */
    static once(event, callback) {
        const onceCallback = (...args) => {
            this.off(event, onceCallback)
            callback(...args)
        }
        
        return this.on(event, onceCallback)
    }

    /*
     * Clear all listeners
     */
    static clear(event) {
        if (event) {
            this.#listeners.delete(event)
        } else {
            this.#listeners.clear()
        }
    }

    /*
     * Get the number of listeners for an event
     */
    static listenerCount(event) {
        const listeners = this.#listeners.get(event)
        return listeners ? listeners.length : 0
    }

}

export { SignalBus }
