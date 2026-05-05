/**
 * Chest Shop Store — Chunk-sharded player shop registry
 * Data Model: { ownerId, itemId, price, quantity, type, chestLocation, signLocation }
 */

import { WorldStore } from "../../core/store/WorldStore.js"

export const ChestShopStore = {
    /**
     * Convert location to a string key
     * @param {import("@minecraft/server").Vector3} loc
     * @returns {string}
     */
    locationToKey(loc) {
        return `${Math.floor(loc.x)},${Math.floor(loc.y)},${Math.floor(loc.z)}`
    },

    /**
     * Convert location to chunk key for sharding
     * @param {import("@minecraft/server").Vector3} loc
     * @returns {string}
     */
    locationToChunkKey(loc) {
        return `${Math.floor(loc.x) >> 4},${Math.floor(loc.z) >> 4}`
    },

    /**
     * Get all shops in a chunk
     * @param {string} chunkKey
     * @returns {Object} Map of signKey -> shopData
     */
    getShopsInChunk(chunkKey) {
        return WorldStore.get(`chestshop:${chunkKey}`) || {}
    },

    /**
     * Save all shops for a chunk
     * @param {string} chunkKey
     * @param {Object} shops
     */
    saveChunk(chunkKey, shops) {
        if (Object.keys(shops).length === 0) {
            WorldStore.delete(`chestshop:${chunkKey}`)
        } else {
            WorldStore.set(`chestshop:${chunkKey}`, shops)
        }
    },

    /**
     * Get a shop by its sign location
     * @param {import("@minecraft/server").Vector3} signLocation
     * @returns {Object|null}
     */
    getShop(signLocation) {
        const chunkKey = this.locationToChunkKey(signLocation)
        const shops = this.getShopsInChunk(chunkKey)
        return shops[this.locationToKey(signLocation)] || null
    },

    /**
     * Create a new chest shop
     * @param {Object} data - Shop data
     * @returns {boolean}
     */
    createShop(data) {
        const chunkKey = this.locationToChunkKey(data.signLocation)
        const shops = this.getShopsInChunk(chunkKey)
        const signKey = this.locationToKey(data.signLocation)

        if (shops[signKey]) return false // Already exists

        shops[signKey] = {
            ownerId: data.ownerId,
            ownerName: data.ownerName,
            itemId: data.itemId,
            price: data.price,
            quantity: data.quantity || 1,
            type: data.type, // 'buy' or 'sell'
            chestLocation: {
                x: Math.floor(data.chestLocation.x),
                y: Math.floor(data.chestLocation.y),
                z: Math.floor(data.chestLocation.z)
            },
            signLocation: {
                x: Math.floor(data.signLocation.x),
                y: Math.floor(data.signLocation.y),
                z: Math.floor(data.signLocation.z)
            },
            created: Date.now()
        }

        this.saveChunk(chunkKey, shops)
        return true
    },

    /**
     * Remove a chest shop by sign location
     * @param {import("@minecraft/server").Vector3} signLocation
     * @returns {boolean}
     */
    removeShop(signLocation) {
        const chunkKey = this.locationToChunkKey(signLocation)
        const shops = this.getShopsInChunk(chunkKey)
        const signKey = this.locationToKey(signLocation)

        if (!shops[signKey]) return false

        delete shops[signKey]
        this.saveChunk(chunkKey, shops)
        return true
    },

    /**
     * Check if a location is a shop sign or linked chest
     * @param {import("@minecraft/server").Vector3} location
     * @returns {Object|null} Shop data if found
     */
    findShopByChestLocation(location) {
        const chunkKey = this.locationToChunkKey(location)
        const shops = this.getShopsInChunk(chunkKey)
        const locKey = this.locationToKey(location)

        for (const shop of Object.values(shops)) {
            if (this.locationToKey(shop.chestLocation) === locKey) {
                return shop
            }
        }
        return null
    }
}
