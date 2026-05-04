import { Database } from "../datastore/DatabaseManager.js"

export const WorldStore = {
    get: (key) => {
        return Database.get(key)
    },

    set: (key, value) => {
        return Database.set(key, value)
    },

    delete: (key) => {
        return Database.delete(key)
    },

    getCollection: (collectionName, itemId = null) => {
        return Database.getSharded(collectionName, itemId)
    },

    setCollection: (collectionName, itemId, data) => {
        return Database.setSharded(collectionName, itemId, data)
    },

    deleteCollection: (collectionName, itemId) => {
        return Database.deleteSharded(collectionName, itemId)
    }
}

