import { Database } from "../datastore/DatabaseManager.js"

/*
 * ENTITY_SPECIFIC_STORAGE_PROXY
 * ----------------------------------------------------------------------------
 * A high-performance abstraction layer for managing persistent data 
 * bound to individual entity identifiers. 
 *
 * PHILOSOPHY: Isolation is mandatory. We enforce a 'player:UUID:KEY' 
 * namespace protocol to prevent cross-buffer contamination in the global 
 * registry.
 */
export const PlayerStore = {
    /* 
     * ENTITY_BOUND_QUERY_VECTOR
     * Resolves the entity-specific key and performs an O(1) lookup 
     * via the DatabaseManager.
     */
    get: (player, key) => {
        const fullKey = `player:${player.id}:${key}`
        return Database.get(fullKey)
    },

    /* 
     * ENTITY_BOUND_COMMIT_VECTOR
     */
    set: (player, key, value) => {
        const fullKey = `player:${player.id}:${key}`
        return Database.set(fullKey, value)
    },

    /* 
     * ENTITY_BOUND_DECOMMISSION_VECTOR
     */
    delete: (player, key) => {
        const fullKey = `player:${player.id}:${key}`
        return Database.delete(fullKey)
    },

    /* 
     * ATOMIC_TRANSACTION_ORCHESTRATOR
     * Proxies the transaction request to ensure sequential execution for 
     * the specific entity UUID. This is the industrial standard for 
     * preventing financial-buffer race conditions.
     */
    transaction: (player, operation) => {
        return Database.transaction(player.id, operation)
    }
}
