/*
 * ISTORE_PERSISTENCE_CONTRACT
 * ----------------------------------------------------------------------------
 * This interface defines the mandatory methods for any module attempting 
 * to act as a persistent-data buffer. We enforce a standardized CRUD 
 * model to ensure that the DatabaseManager can proxy calls without 
 * knowing the underlying storage implementation (JSON, Scoreboard, etc).
 *
 * PHILOSOPHY: All operations are asynchronous to prevent blocking the 
 * main server thread during large buffer flushes.
 */

class IStore {
    /**
     * Retrieve value by key.
     * 
     * EXPECTS:
     * - key: String key identifier.
     * - defaultValue: Value returned if key is missing.
     * 
     * GUARANTEES:
     * - Returns value associated with key, or defaultValue if not present.
     * 
     * @param {string} key - Lookup key.
     * @param {any} defaultValue - Fallback value.
     */
    async get(key, defaultValue) {
        void key; void defaultValue;
        throw new Error("[ContractViolation] 'get' method must be implemented.");
    }

    /**
     * Set value associated with key.
     * 
     * EXPECTS:
     * - key: String key identifier.
     * - value: Value to store.
     * 
     * GUARANTEES:
     * - Returns boolean indicating success of write action.
     * 
     * @param {string} key - Destination key.
     * @param {any} value - Stored payload.
     */
    async set(key, value) {
        void key; void value;
        throw new Error("[ContractViolation] 'set' method must be implemented.");
    }

    /**
     * Delete key from store.
     * 
     * EXPECTS:
     * - key: String key identifier to remove.
     * 
     * GUARANTEES:
     * - Returns boolean indicating success of deletion.
     * 
     * @param {string} key - Lookup key.
     */
    async delete(key) {
        void key;
        throw new Error("[ContractViolation] 'delete' method must be implemented.");
    }

    /**
     * Checks if key exists in store.
     * 
     * EXPECTS:
     * - key: String key identifier to verify.
     * 
     * GUARANTEES:
     * - Returns true if key is present, false otherwise.
     * 
     * @param {string} key - Lookup key.
     */
    async has(key) {
        void key;
        throw new Error("[ContractViolation] 'has' method must be implemented.");
    }

    /**
     * Purges all keys and values from store.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Clears the underlying store structure.
     */
    async clear() {
        throw new Error("[ContractViolation] 'clear' method must be implemented.");
    }
}

export { IStore };
