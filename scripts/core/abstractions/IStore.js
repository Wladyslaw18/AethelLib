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
    /* 
     * DATA_RETRIEVAL_VECTOR
     * Fetches a value from the persistent store. Includes a mandatory 
     * defaultValue parameter to prevent undefined-reference crashes in 
     * downstream modules.
     */
    async get(key, defaultValue) {
        void key; void defaultValue
        throw new Error("[ContractViolation] 'get' method must be implemented.");
    }

    /* 
     * DATA_INJECTION_VECTOR
     * Commits a value to the persistent store. Returns a boolean status 
     * to indicate if the write operation was successful.
     */
    async set(key, value) {
        void key; void value
        throw new Error("[ContractViolation] 'set' method must be implemented.");
    }

    /* 
     * DATA_PURGE_VECTOR
     * Removes a key-value pair from the persistent store.
     */
    async delete(key) {
        void key
        throw new Error("[ContractViolation] 'delete' method must be implemented.");
    }

    /* 
     * KEY_EXISTENCE_PROBE
     * Checks if a specific key has an active entry in the store.
     */
    async has(key) {
        void key
        throw new Error("[ContractViolation] 'has' method must be implemented.");
    }

    /* 
     * MASTER_WIPE_PROTOCOL
     * Nukes every single entry in the store. This is a destructive 
     * operation and must be implemented with caution.
     */
    async clear() {
        throw new Error("[ContractViolation] 'clear' method must be implemented.");
    }
}

export { IStore }
