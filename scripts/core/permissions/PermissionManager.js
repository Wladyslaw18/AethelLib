import { PermissionData } from "./PermissionData.js"
import { system } from "@minecraft/server"
import { Kernel } from "../Kernel.js"
import { Configuration } from "../../Configuration.js"

/*
 * INDUSTRIAL_PERMISSION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * The primary security gatekeeper for the AethelLib industrial ecosystem. 
 * Implements a high-performance Role-Based Access Control (RBAC) engine with 
 * O(1) resolution for cached clearance levels.
 *
 * PHILOSOPHY: Security is absolute. Implements a multi-layered verification 
 * strategy:
 * 1. Hard-coded SUPER_ADMIN bypass tokens.
 * 2. High-speed volatile memory-cache (TTL: 5s).
 * 3. Data-Oriented Rank Hierarchy resolution logic.
 */
export class PermissionManager {
    static #instance = null
    static #data = new PermissionData() // MASTER_DOD_AUTH_STORE
    static #playerCache = new Map() // VOLATILE_ACCESS_BUFFER
    static #CACHE_TTL = 5000 
    static #stats = {
        cacheHits: 0,
        cacheMisses: 0,
        totalChecks: 0
    }
    
    static getInstance() {
        if (!this.#instance) {
            this.#instance = new PermissionManager()
        }
        return this.#instance
    }
    
    constructor() {
        this.startCleanupTask()
    }

    /*
     * AUTH_MANIFEST_STAGING
     * Handshakes with the RankStore to populate the PermissionData layer 
     * during the industrial bootstrap sequence.
     */
    init() {
        const RankStore = Kernel.get("rankStore")
        if (!RankStore) {
            console.error("[PermissionManager] FATAL: RankStore registry unreachable.");
            return
        }

        const allRanks = RankStore.getAllRanks()

        for (const [tag, data] of Object.entries(allRanks)) {
            PermissionManager.#data.addRank(
                tag, 
                data.order || 0, 
                data.name || tag, 
                data.colorText || "§7", 
                data.colorName || "§7"
            )

            if (data.permissions) {
                for (const [perm, value] of Object.entries(data.permissions)) {
                    PermissionManager.#data.setPermission(tag, perm, value)
                }
            }
        }

        console.log(`[PermissionManager] RBAC_NODES_INJECTED: ${Object.keys(allRanks).length}`);
    }

    /*
     * CLEARANCE_VERIFICATION_VECTOR
     * Queries the system for specific auth-node possession. Implements a 
     * cache-aside strategy to minimize CPU cycles.
     */
    hasPermission(player, permission) {
        if (this._isSuperAdmin(player)) return true

        PermissionManager.#stats.totalChecks++
        
        /* CACHE_PROBE */
        let cache = PermissionManager.#playerCache.get(player.id)
        if (cache && Date.now() - cache.timestamp < PermissionManager.#CACHE_TTL) {
            PermissionManager.#stats.cacheHits++
            return cache.permissions.get(permission) ?? false
        }
        
        /* CACHE_MISS_PROTOCOL */
        PermissionManager.#stats.cacheMisses++
        
        this.syncPlayerRanks(player)
        const permissions = this.#computePermissions(player)
        
        PermissionManager.#playerCache.set(player.id, {
            permissions,
            timestamp: Date.now()
        })
        
        return permissions.get(permission) ?? false
    }

    /*
     * RANK_SYNCHRONIZATION_PROTOCOL
     * Maps entity-tags into the PermissionData registry for real-time 
     * identity calibration.
     */
    syncPlayerRanks(player) {
        const tags = player.getTags()
        PermissionManager.#data.setPlayerRanks(player.id, tags)
    }

    /*
     * HIERARCHY_WEIGHT_RESOLVER
     */
    getHighestRank(player) {
        if (this._isSuperAdmin(player)) {
            return { id: "admin", name: "Administrator", order: 1000 }
        }

        return PermissionManager.#data.getHighestRank(player.id)
    }

    /*
     * HIERARCHY_VALIDATION_GATE
     * Prevents lower-ranking staff from performing actions on 
     * higher-clearance entities.
     */
    canActOn(actor, target) {
        if (this._isSuperAdmin(actor)) return true
        if (this._isSuperAdmin(target)) return false

        this.syncPlayerRanks(actor)
        this.syncPlayerRanks(target)

        return PermissionManager.#data.canActOn(actor.id, target.id)
    }

    /*
     * AUTH_NODE_COMPUTATION_ENGINE
     * Merges permissions across all assigned ranks. Higher weights 
     * override lower weights.
     */
    #computePermissions(player) {
        const permissions = new Map()
        const playerRanks = PermissionManager.#data.getPlayerRanks(player.id)
        
        for (const rankId of playerRanks) {
            const rankPerms = PermissionManager.#data.getRankPermissions(rankId)
            
            for (const [perm, value] of Object.entries(rankPerms)) {
                if (!permissions.has(perm)) {
                    permissions.set(perm, value)
                }
            }
        }
        
        return permissions
    }
    
    /* 
     * BUFFER_TERMINATION_PROTOCOL
     */
    invalidatePlayerCache(playerId = null) {
        if (playerId) {
            PermissionManager.#playerCache.delete(playerId)
        } else {
            PermissionManager.#playerCache.clear()
        }
    }
    
    /* 
     * MAINTENANCE_SCHEDULER
     */
    startCleanupTask() {
        system.runInterval(() => {
            PermissionManager.#data.cleanup()
            this.cleanupExpiredCache()
        }, 6000) 
    }
    
    /* 
     * MEMORY_SANITY_PROTOCOL
     */
    cleanupExpiredCache() {
        const now = Date.now()
        for (const [playerId, cache] of PermissionManager.#playerCache) {
            if (now - cache.timestamp > PermissionManager.#CACHE_TTL) {
                PermissionManager.#playerCache.delete(playerId)
            }
        }
    }

    /*
     * SUPER_ADMIN_TOKEN_PROBE
     */
    _isSuperAdmin(player) {
        const tags = player.getTags()
        return Configuration.SUPER_ADMIN_TAGS.some(tag => tags.includes(tag))
    }

    /*
     * ANALYTICS_ACCESSOR
     */
    getStats() {
        const cacheHitRate = PermissionManager.#stats.totalChecks > 0 ? 
            Math.round((PermissionManager.#stats.cacheHits / PermissionManager.#stats.totalChecks) * 100) : 0
            
        return {
            ...PermissionManager.#stats,
            cacheHitRate,
            cachedPlayers: PermissionManager.#playerCache.size,
            dataStats: PermissionManager.#data.getStats()
        }
    }
}

export const PermissionManagerInstance = PermissionManager.getInstance()
