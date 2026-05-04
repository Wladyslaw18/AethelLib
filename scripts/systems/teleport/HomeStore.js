/**
 * Home Store - Manages player home data using Dynamic Properties
 * No scoreboard horror, no invisible entities - just clean data storage
 */

import { Kernel } from "../../core/Kernel.js"
import { StoreKeys } from "../../core/store/StoreKeys.js"
import { Vector3 } from "@minecraft/server"

export const HomeStore = {
    /**
     * Get all homes for a player
     * @param {Player} player - Player object
     * @returns {Promise<Object>} Homes object or empty object
     */
    async getHomes(player) {
        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.get(player, StoreKeys.homeList(player.id)) || {}
    },

    /**
     * Get a specific home for a player
     * @param {Player} player - Player object  
     * @param {string} name - Home name
     * @returns {Promise<Object|null>} Home data or null
     */
    async getHome(player, name) {
        const homes = await this.getHomes(player)
        return homes[name] || null
    },

    /**
     * Set a home for a player
     * @param {Player} player - Player object
     * @param {string} name - Home name
     * @param {Vector3} location - Home location
     * @param {string} dimension - Dimension ID
     * @returns {Promise<boolean>} Success status
     */
    async setHome(player, name, location, dimension) {
        if (!name || name.length < 1 || name.length > 16) {
            return false
        }

        const homes = await this.getHomes(player)
        
        // Limit homes per player (configurable, default 10)
        const maxHomes = 10
        if (!homes[name] && Object.keys(homes).length >= maxHomes) {
            return false
        }

        homes[name] = {
            x: Math.floor(location.x),
            y: Math.floor(location.y),
            z: Math.floor(location.z),
            dimension: dimension,
            created: Date.now()
        }

        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.set(player, StoreKeys.homeList(player.id), homes)
    },

    /**
     * Delete a home for a player
     * @param {Player} player - Player object
     * @param {string} name - Home name
     * @returns {Promise<boolean>} Success status
     */
    async deleteHome(player, name) {
        const homes = await this.getHomes(player)
        
        if (!homes[name]) {
            return false
        }

        delete homes[name]
        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.set(player, StoreKeys.homeList(player.id), homes)
    },

    /**
     * Check if a home exists for a player
     * @param {Player} player - Player object
     * @param {string} name - Home name
     * @returns {Promise<boolean>} Whether home exists
     */
    async hasHome(player, name) {
        const homes = await this.getHomes(player)
        return homes.hasOwnProperty(name)
    },

    /**
     * Get home count for a player
     * @param {Player} player - Player object
     * @returns {Promise<number>} Number of homes
     */
    async getHomeCount(player) {
        const homes = await this.getHomes(player)
        return Object.keys(homes).length
    }
}

