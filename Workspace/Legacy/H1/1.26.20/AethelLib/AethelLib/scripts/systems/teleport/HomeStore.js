import { Kernel } from "../../core/Kernel.js"
import { StoreKeys } from "../../core/store/StoreKeys.js"

/*
 * INDUSTRIAL_SPATIAL_ANCHOR_REGISTRY
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for entity-specific spatial waypoints 
 * (Homes). Interfaces with the PlayerStore to manage the persistence and 
 * validation of spatial-anchor nodes.
 *
 * PHILOSOPHY: Waypoints are the coordinates of the empire. Use this 
 * registry to manifest and preserve the entity's industrial navigation 
 * manifest.
 */
export const HomeStore = {
    /* 
     * ENTITY_MANIFEST_QUERY
     */
    async getHomes(player) {
        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.get(player, StoreKeys.homeList(player.id)) || {}
    },

    /* 
     * ANCHOR_NODE_QUERY
     */
    async getHome(player, name) {
        const homes = await this.getHomes(player)
        return homes[name] || null
    },

    /* 
     * ANCHOR_NODE_INJECTION
     * Calibrates a new spatial-anchor for the entity. Implements an 
     * industrial-scale limit on the total number of active nodes.
     */
    async setHome(player, name, location, dimension) {
        if (!name || name.length < 1 || name.length > 16) return false

        const homes = await this.getHomes(player)
        const maxHomes = 10 // INDUSTRIAL_REGISTRY_LIMIT

        if (!homes[name] && Object.keys(homes).length >= maxHomes) return false

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

    /* 
     * ANCHOR_NODE_DECOMMISSION
     */
    async deleteHome(player, name) {
        const homes = await this.getHomes(player)
        if (!homes[name]) return false
        delete homes[name]
        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.set(player, StoreKeys.homeList(player.id), homes)
    },

    /* 
     * REGISTRY_STATUS_QUERY
     */
    async hasHome(player, name) {
        const homes = await this.getHomes(player)
        return homes.hasOwnProperty(name)
    },

    async getHomeCount(player) {
        const homes = await this.getHomes(player)
        return Object.keys(homes).length
    }
}
