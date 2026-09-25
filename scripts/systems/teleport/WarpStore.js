import { WorldStore } from "../../core/store/WorldStore.js"
import { StoreKeys } from "../../core/store/StoreKeys.js"

/*
 * INDUSTRIAL_GLOBAL_WAYPOINT_REGISTRY
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the server's public spatial 
 * waypoints (Warps). Interfaces with the WorldStore to manage the global 
 * waypoint-buffer and ensure persistent spatial-integrity.
 *
 * PHILOSOPHY: Public waypoints are the industrial nodes of the world. 
 * Use this registry to manifest and preserve the server's global 
 * navigation manifest.
 */
export const WarpStore = {
    /* 
     * GLOBAL_MANIFEST_QUERY
     */
    async getWarps() {
        return WorldStore.get(StoreKeys.warpList()) || {}
    },

    /* 
     * WAYPOINT_NODE_QUERY
     */
    async getWarp(name) {
        const warps = await this.getWarps()
        return warps[name] || null
    },

    /* 
     * WAYPOINT_NODE_INJECTION
     * Calibrates a new public waypoint in the global registry. Implements 
     * regex-based identifier validation and coordinate-flooring to ensure 
     * data-integrity.
     */
    async setWarp(name, location, dimension, creator) {
        if (!name || name.length < 1 || name.length > 16) return false
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false

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

    /* 
     * WAYPOINT_NODE_DECOMMISSION
     */
    async deleteWarp(name) {
        const warps = await this.getWarps()
        if (!warps[name]) return false
        delete warps[name]
        const success = await WorldStore.set(StoreKeys.warpList(), warps)
        
        // Clean up hub pointer if this deleted warp was the designated hub
        const currentHub = await this.getHubWarpName()
        if (currentHub && currentHub.toLowerCase() === name.toLowerCase()) {
            await WorldStore.delete(StoreKeys.hubWarp())
        }

        return success
    },

    /* 
     * REGISTRY_STATUS_QUERY
     */
    async hasWarp(name) {
        const warps = await this.getWarps()
        return warps.hasOwnProperty(name)
    },

    async getWarpCount() {
        const warps = await this.getWarps()
        return Object.keys(warps).length
    },

    /* 
     * HUB_WARP_POINTER_RESOLVER
     * Connects /hub and /sethub to the dynamic WarpStore waypoint architecture.
     */
    async getHubWarpName() {
        return (await WorldStore.get(StoreKeys.hubWarp())) || null
    },

    async setHubWarpName(name) {
        if (!name) return false
        return WorldStore.set(StoreKeys.hubWarp(), name)
    },

    async getHubWarp() {
        const designatedName = await this.getHubWarpName()
        if (designatedName) {
            const warp = await this.getWarp(designatedName)
            if (warp) return { name: designatedName, warp }
        }

        // Fallback: check if standard warp names exist in the registry
        const hubWarp = await this.getWarp("hub")
        if (hubWarp) return { name: "hub", warp: hubWarp }
        const spawnWarp = await this.getWarp("spawn")
        if (spawnWarp) return { name: "spawn", warp: spawnWarp }

        return null
    },

    /*
     * HUB_TIMERS_CONFIGURATION
     */
    async getHubCooldown() {
        const val = await WorldStore.get(StoreKeys.hubCooldown())
        return val !== null && val !== undefined ? Number(val) : 15
    },

    async setHubCooldown(seconds) {
        const sec = Math.max(0, parseInt(seconds) || 0)
        return WorldStore.set(StoreKeys.hubCooldown(), sec)
    },

    async getHubDelay() {
        const val = await WorldStore.get(StoreKeys.hubDelay())
        return val !== null && val !== undefined ? Number(val) : 3
    },

    async setHubDelay(seconds) {
        const sec = Math.max(0, parseInt(seconds) || 0)
        return WorldStore.set(StoreKeys.hubDelay(), sec)
    }
}
