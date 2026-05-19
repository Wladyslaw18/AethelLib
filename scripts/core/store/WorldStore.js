import { JournaledDb } from "../datastore/JournaledDatabase.js"

/*
 * GLOBAL_PERSISTENCE_PROXY
 * ----------------------------------------------------------------------------
 * A high-performance abstraction layer for managing global server state. 
 * Orchestrates buffered access to the world's persistent registry via the 
 * DatabaseManager.
 *
 * PHILOSOPHY: Global state is the industrial memory of the world. 
 * Use the collection-vectors to manage large datasets without 
 * saturating the native property-limit.
 */
export const WorldStore = {
    /* 
     * GLOBAL_QUERY_VECTOR
     */
    get: (key) => {
        return JournaledDb.get(key)
    },

    /* 
     * GLOBAL_COMMIT_VECTOR
     */
    set: (key, value) => {
        return JournaledDb.set(key, value)
    },

    /* 
     * GLOBAL_DECOMMISSION_VECTOR
     */
    delete: (key) => {
        return JournaledDb.delete(key)
    },

    /* 
     * SHARDED_COLLECTION_QUERY_VECTOR
     * Bridges the sharding-protocol from the DatabaseManager to facilitate 
     * the retrieval of large industrial manifests.
     */
    getCollection: (collectionName, itemId = null) => {
        return JournaledDb.getSharded(collectionName, itemId)
    },

    /* 
     * SHARDED_COLLECTION_COMMIT_VECTOR
     */
    setCollection: (collectionName, itemId, data) => {
        return JournaledDb.setSharded(collectionName, itemId, data)
    },

    /* 
     * SHARDED_COLLECTION_DECOMMISSION_VECTOR
     */
    deleteCollection: (collectionName, itemId) => {
        return JournaledDb.deleteSharded(collectionName, itemId)
    }
}
