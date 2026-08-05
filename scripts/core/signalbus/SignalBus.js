/**
 * Event bus for cross-module communication.
 * Allows modules to stay decoupled by using signals instead of direct calls.
 */
class SignalBus {
    // List of registered event listeners
    static #listeners = new Map();

    /**
     * Subscribe to a signal event.
     * 
     * EXPECTS:
     * - event: String identifier representing the signal topic.
     * - callback: Callback function triggered when signal is emitted.
     * 
     * GUARANTEES:
     * - Appends callback to signal event listeners array.
     * - Returns an unsubscription callback function for easy cleanup.
     * 
     * @param {string} event - Signal event topic.
     * @param {Function} callback - Trigger callback.
     * @returns {Function} Unsubscribe helper.
     */
    static on(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, []);
        }
        
        this.#listeners.get(event).push(callback);
        
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe a callback from a signal event.
     * 
     * EXPECTS:
     * - event: String identifier representing the signal topic.
     * - callback: Callback function to remove.
     * 
     * GUARANTEES:
     * - Removes callback from event listeners array if present.
     * - Returns true if found and removed, false otherwise.
     * 
     * @param {string} event - Signal event topic.
     * @param {Function} callback - Callback to remove.
     * @returns {boolean} Whether unsubscribe was successful.
     */
    static off(event, callback) {
        const listeners = this.#listeners.get(event);
        if (!listeners) return false;
        
        const index = listeners.indexOf(callback);
        if (index === -1) return false;
        
        listeners.splice(index, 1);
        return true;
    }

    /**
     * Emit a signal to all active listeners.
     * 
     * EXPECTS:
     * - event: String identifier representing the signal topic.
     * - args: Arguments list sent to event listeners.
     * 
     * GUARANTEES:
     * - Executes all callbacks subscribed to event catching internal execution errors.
     * 
     * @param {string} event - Signal event topic.
     * @param {any[]} args - Dispatched argument parameters.
     */
    static emit(event, ...args) {
        const listeners = this.#listeners.get(event);
        if (!listeners) return;
        
        for (const callback of listeners) {
            try {
                callback(...args);
            } catch (error) {
                console.error(`[SignalBus] Error in signal '${event}': ${error}`);
            }
        }
    }

    /**
     * Listen for a signal event once.
     * 
     * EXPECTS:
     * - event: String identifier representing the signal topic.
     * - callback: Callback function triggered on first emission.
     * 
     * GUARANTEES:
     * - Subscribes a single-use wrapper callback to event.
     * - Automatically unsubscribes itself when called first time.
     * - Returns unsubscribe function.
     * 
     * @param {string} event - Signal event topic.
     * @param {Function} callback - Callback function.
     * @returns {Function} Unsubscribe helper.
     */
    static once(event, callback) {
        const onceCallback = (...args) => {
            this.off(event, onceCallback);
            callback(...args);
        };
        
        return this.on(event, onceCallback);
    }

    /**
     * Clears all listeners for an event or all events in total.
     * 
     * EXPECTS:
     * - event: (Optional) String topic name to clear.
     * 
     * GUARANTEES:
     * - If event is provided, deletes listeners for that event.
     * - If no event is provided, clears all registered events.
     * 
     * @param {string} [event] - Signal event topic.
     */
    static clear(event) {
        if (event) {
            this.#listeners.delete(event);
        } else {
            this.#listeners.clear();
        }
    }

    /**
     * Get the number of active listeners for a signal.
     * 
     * EXPECTS:
     * - event: String topic name.
     * 
     * GUARANTEES:
     * - Returns integer count representing active subscribers.
     * 
     * @param {string} event - Signal event topic.
     * @returns {number} Active listeners count.
     */
    static listenerCount(event) {
        const listeners = this.#listeners.get(event);
        return listeners ? listeners.length : 0;
    }
}

export { SignalBus };
