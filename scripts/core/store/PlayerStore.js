import { Kernel } from "../Kernel.js";
import { JournaledDb } from "../datastore/JournaledDatabase.js"

/*
 * ENTITY_SPECIFIC_STORAGE_PROXY
 */

// Keep name mapping synchronized for offline resolution
Kernel.world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player } = ev
    
    // 1. Maintain case-insensitive name-to-UUID index and handle name changes
    const oldName = JournaledDb.get(`player:${player.id}:name`)
    if (oldName && oldName.toLowerCase() !== player.name.toLowerCase()) {
        JournaledDb.delete(`playername:${oldName.toLowerCase()}`)
    }
    
    JournaledDb.set(`player:${player.id}:name`, player.name)
    JournaledDb.set(`playername:${player.name.toLowerCase()}`, player.id)
    
    // 2. Track registered players list
    const allUuids = JournaledDb.get("ae:player_index") || []
    if (!allUuids.includes(player.id)) {
        allUuids.push(player.id)
        JournaledDb.set("ae:player_index", allUuids)
    }
})

export const PlayerStore = {

    /* 
     * ENTITY_BOUND_QUERY_VECTOR
     * Resolves the entity-specific key and performs an O(1) lookup 
     * via the DatabaseManager.
     */
    get: (player, key) => {
        const id = typeof player === "string" ? player : player?.id
        if (!id) return null
        const fullKey = `player:${id}:${key}`
        return JournaledDb.get(fullKey)
    },

    /* 
     * ENTITY_BOUND_COMMIT_VECTOR
     */
    set: (player, key, value) => {
        const id = typeof player === "string" ? player : player?.id
        if (!id) return false
        const fullKey = `player:${id}:${key}`
        return JournaledDb.set(fullKey, value)
    },

    /* 
     * ENTITY_BOUND_DECOMMISSION_VECTOR
     */
    delete: (player, key) => {
        const id = typeof player === "string" ? player : player?.id
        if (!id) return false
        const fullKey = `player:${id}:${key}`
        return JournaledDb.delete(fullKey)
    },

    /* 
     * ATOMIC_TRANSACTION_ORCHESTRATOR
     * Proxies the transaction request to ensure sequential execution for 
     * the specific entity UUID. This is the industrial standard for 
     * preventing financial-buffer race conditions.
     */
    transaction: (player, operation) => {
        const id = typeof player === "string" ? player : player?.id
        return JournaledDb.transaction(id, operation)
    }
}
