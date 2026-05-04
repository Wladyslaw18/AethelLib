/**
 * Signal Bus - Event communication system
 * @author Aethelgrad
 * @version 1.0.0
 */

/**
 * Event signal bus for decoupled communication
 */
class SignalBus {
    /** @type {Map<string, Function[]>} */
    static #listeners = new Map()

    /**
     * Subscribe to event
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     * @returns {Function} Unsubscribe function
     */
    static on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, [])
        }
        
        this.#listeners.get(event).push(callback)
        
        // Return unsubscribe function
        return () => this.off(event, callback)
    }

    /**
     * Unsubscribe from event
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     * @returns {boolean} Whether listener was removed
     */
    static off(event, callback) {
        const listeners = this.#listeners.get(event)
        if (!listeners) return false
        
        const index = listeners.indexOf(callback)
        if (index === -1) return false
        
        listeners.splice(index, 1)
        return true
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {...any} args - Event arguments
     * @returns {void}
     */
    static emit(event, ...args) {
        const listeners = this.#listeners.get(event)
        if (!listeners) return
        
        for (const callback of listeners) {
            try {
                callback(...args)
            } catch (error) {
                console.error(`SignalBus error in ${event}: ${error}`)
            }
        }
    }

    /**
     * Subscribe to event once
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     * @returns {Function} Unsubscribe function
     */
    static once(event, callback) {
        const onceCallback = (...args) => {
            this.off(event, onceCallback)
            callback(...args)
        }
        
        return this.on(event, onceCallback)
    }

    /**
     * Clear all listeners for event
     * @param {string} [event] - Event name (clear all if not provided)
     * @returns {void}
     */
    static clear(event) {
        if (event) {
            this.#listeners.delete(event)
        } else {
            this.#listeners.clear()
        }
    }

    /**
     * Get listener count for event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    static listenerCount(event) {
        const listeners = this.#listeners.get(event)
        return listeners ? listeners.length : 0
    }
}

export { SignalBus }
