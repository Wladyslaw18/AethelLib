/**
 * System interface - Contract for all systems
 * @author Aethelgrad
 * @version 1.0.0
 */

/**
 * @template T
 * @interface ISystem
 */
class ISystem {
    /**
     * Initialize the system
     * @param {import("../../types.js").SystemConfig} config - System configuration
     * @returns {Promise<void>}
     */
    async initialize(config) {
        throw new Error("initialize method must be implemented")
    }

    /**
     * Update the system
     * @param {number} tick - Current tick
     * @returns {Promise<void>}
     */
    async update(tick) {
        throw new Error("update method must be implemented")
    }

    /**
     * Shutdown the system
     * @returns {Promise<void>}
     */
    async shutdown() {
        throw new Error("shutdown method must be implemented")
    }

    /**
     * Get system data
     * @returns {T} System data
     */
    get data() {
        throw new Error("data getter must be implemented")
    }
}

export { ISystem }
