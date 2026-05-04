/**
 * Warp Store - Manages server-wide warp data using World Dynamic Properties
 * No scoreboard horror, no invisible entities - just clean data storage
 */

import { WorldStore } from "../../core/store/WorldStore.js"
import { StoreKeys } from "../../core/store/StoreKeys.js"
import { Vector3 } from "@minecraft/server"

export const WarpStore = {
    /**
     * Get all warps
     * @returns {Promise<Object>} Warps object or empty object
     */
    async getWarps() {
        return WorldStore.get(StoreKeys.warpList()) || {}
    },

    /**
     * Get a specific warp
     * @param {string} name - Warp name
     * @returns {Promise<Object|null>} Warp data or null
     */
    async getWarp(name) {
        const warps = await this.getWarps()
        return warps[name] || null
    },

    /**
     * Set a warp
     * @param {string} name - Warp name
     * @param {Vector3} location - Warp location
     * @param {string} dimension - Dimension ID
     * @param {string} creator - Creator name
     * @returns {Promise<boolean>} Success status
     */
    async setWarp(name, location, dimension, creator) {
        if (!name || name.length < 1 || name.length > 16) {
            return false
        }

        // Validate warp name
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            return false
        }

        const warps = await this.getWarps()
        
        warps[name] = {
            x: Math.floor(location.x),
            y: Math.floor(location.y),
            z: Math.floor(location.z),
            dimension: dimension,
            creator: creator,
            created: Date.now()
        }

        return WorldStore.set(StoreKeys.warpList(), warps)
    },

    /**
     * Delete a warp
     * @param {string} name - Warp name
     * @returns {Promise<boolean>} Success status
     */
    async deleteWarp(name) {
        const warps = await this.getWarps()
        
        if (!warps[name]) {
            return false
        }

        delete warps[name]
        return WorldStore.set(StoreKeys.warpList(), warps)
    },

    /**
     * Check if a warp exists
     * @param {string} name - Warp name
     * @returns {Promise<boolean>} Whether warp exists
     */
    async hasWarp(name) {
        const warps = await this.getWarps()
        return warps.hasOwnProperty(name)
    },

    /**
     * Get warp count
     * @returns {Promise<number>} Number of warps
     */
    async getWarpCount() {
        const warps = await this.getWarps()
        return Object.keys(warps).length
    }
}

