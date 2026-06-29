/**
 * INDUSTRIAL_LIFECYCLE_CONTROLLER
 * ----------------------------------------------------------------------------
 * Prevents double-execution and memory leaks from multiple system 
 * initializations during script reloads.
 */

export class LifecycleController {
    static _locks = new Map();
    static _disposers = new Map();

    /**
     * Attempts to acquire a boot-lock for a system.
     * @param {string} systemId Unique identifier for the system.
     * @returns {boolean} True if lock acquired, false if already locked.
     */
    static boot(systemId) {
        if (this._locks.has(systemId)) {
            console.warn(`[Lifecycle] System '${systemId}' already active. Blocking re-init.`);
            return false;
        }
        this._locks.set(systemId, true);
        return true;
    }

    /**
     * Registers a disposer function to be called on shutdown.
     * @param {string} systemId 
     * @param {Function} disposer 
     */
    static registerDisposer(systemId, disposer) {
        this._disposers.set(systemId, disposer);
    }

    /**
     * Shuts down a system and clears its lock.
     * @param {string} systemId 
     */
    static shutdown(systemId) {
        const disposer = this._disposers.get(systemId);
        if (disposer) {
            try {
                disposer();
            } catch (e) {
                console.error(`[Lifecycle] Shutdown failure for system '${systemId}': ${e}`);
            }
            this._disposers.delete(systemId);
        }
        this._locks.delete(systemId);
    }

    /**
     * Global shutdown sequence for all registered systems.
     */
    static shutdownAll() {
        for (const systemId of this._disposers.keys()) {
            this.shutdown(systemId);
        }
    }
}
