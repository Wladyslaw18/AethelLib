/**
 * Store interface - Contract for all storage systems
 * @author Aethelgrad
 * @version 1.0.0
 */

/**
 * @template T
 * @interface IStore
 */
class IStore {
    /**
     * Get value
     * @param {string} key - Storage key
     * @param {T} [defaultValue] - Default value
     * @returns {Promise<T>} Retrieved value
     */
    async get(key, defaultValue) {
        throw new Error("get method must be implemented")
    }

    /**
     * Set value
     * @param {string} key - Storage key
     * @param {T} value - Value to store
     * @returns {Promise<boolean>} Whether operation succeeded
     */
    async set(key, value) {
        throw new Error("set method must be implemented")
    }

    /**
     * Delete value
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Whether operation succeeded
     */
    async delete(key) {
        throw new Error("delete method must be implemented")
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Whether key exists
     */
    async has(key) {
        throw new Error("has method must be implemented")
    }

    /**
     * Clear all values
     * @returns {Promise<boolean>} Whether operation succeeded
     */
    async clear() {
        throw new Error("clear method must be implemented")
    }
}

export { IStore }
