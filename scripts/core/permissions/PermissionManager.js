import { PermissionData } from "./PermissionData.js"
import { Kernel } from "../Kernel.js"
import { Configuration } from "../../Configuration.js"

/**
 * Manages player permissions and rank hierarchies.
 * Uses a 5-second cache to keep performance high.
 */
export class PermissionManager {
    static #instance = null
    static #data = new PermissionData() // Master storage for all rank data
    static #playerCache = new Map() // Cache for resolved player permissions
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

    /**
     * Load ranks from the store and register them
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
                data.colorName || "§7", 
                data.colorText || "§7"
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
        PermissionManager.#stats.totalChecks++
        
        /* CACHE_PROBE */
        const cache = PermissionManager.#playerCache.get(player.id)
        if (cache && Date.now() - cache.timestamp < PermissionManager.#CACHE_TTL) {
            PermissionManager.#stats.cacheHits++
            if (cache.isSuperAdmin) return true
            return cache.permissions.get(permission) ?? false
        }
        
        /* CACHE_MISS_PROTOCOL */
        PermissionManager.#stats.cacheMisses++
        
        // Check SuperAdmin status and cache it
        const isSuperAdmin = this._isSuperAdmin(player)
        if (isSuperAdmin) {
            PermissionManager.#playerCache.set(player.id, {
                permissions: new Map(),
                isSuperAdmin: true,
                timestamp: Date.now()
            })
            return true
        }

        this.syncPlayerRanks(player)
        const permissions = this.#computePermissions(player)
        
        PermissionManager.#playerCache.set(player.id, {
            permissions,
            isSuperAdmin: false,
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
        // 🛑 SHADOW_CLEARANCE: Gods have infinite power, but no hardcoded visual manifest.
        return PermissionManager.#data.getHighestRank(player.id)
    }

    /*
     * HIERARCHY_VALIDATION_GATE
     * Prevents lower-ranking staff from performing actions on 
     * higher-clearance entities.
     */
    canActOn(actor, target) {
        const actorSA = this._isSuperAdmin(actor)
        const targetSA = this._isSuperAdmin(target)
        
        if (actorSA) return true
        if (targetSA) return false

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
        
        // SCAN_HIERARCHY: Highest rank takes priority unless it says 'Inherit'
        for (const rankId of playerRanks) {
            const rankPerms = PermissionManager.#data.getRankPermissions(rankId)
            
            for (const [perm, value] of Object.entries(rankPerms)) {
                if (permissions.has(perm)) continue

                // 3-STATE_LOGIC_RESOLUTION
                // 0: NO_ACTION | 1: ALLOW | 2: DENY
                if (value === 1) { // 1 IS ALLOW
                    permissions.set(perm, true)
                } else if (value === 2) { // 2 IS DENY
                    permissions.set(perm, false)
                }
                // If value is 0 (NO_ACTION), we skip and look for the next rank's value
            }
        }
        
        // BASELINE_FALLBACK: If node is still unresolved, check the 'member' rank
        const memberRank = PermissionManager.#data.getRankPermissions("member")
        for (const [perm, value] of Object.entries(memberRank)) {
            if (!permissions.has(perm)) {
                // For member rank, we treat truthy/0 as true, falsy/2 as false
                permissions.set(perm, value === true || value === 0)
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
        Kernel.system.runInterval(() => {
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

