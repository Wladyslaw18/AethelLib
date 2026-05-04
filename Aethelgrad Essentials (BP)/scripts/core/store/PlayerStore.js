import { Database } from "../datastore/DatabaseManager.js"

export const PlayerStore = {
    get: (player, key) => {
        const fullKey = `player:${player.id}:${key}`
        return Database.get(fullKey)
    },

    set: (player, key, value) => {
        const fullKey = `player:${player.id}:${key}`
        return Database.set(fullKey, value)
    },

    delete: (player, key) => {
        const fullKey = `player:${player.id}:${key}`
        return Database.delete(fullKey)
    },

    // Transaction support for atomic operations
    transaction: (player, operation) => {
        return Database.transaction(player.id, operation)
    }
}
