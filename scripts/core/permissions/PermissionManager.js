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

        // 1. Wipe memory of deleted/superseded ranks to synchronize layout state
        PermissionManager.#data = new PermissionData()

        for (const [tag, data] of Object.entries(allRanks)) {
            // 2. Safety guard: ignore undefined rank definitions
            if (!data) continue

            PermissionManager.#data.addRank(
                tag, 
                data.order || 0, 
                data.name || tag, 
                data.colorName || "\u00A77", 
                data.colorText || "\u00A77",
                data.hideRanks || false
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
    /*
     * CACHE_RESOLVER_VECTOR
     */
    _getOrComputeCache(player) {
        let cache = PermissionManager.#playerCache.get(player.id)
        if (cache && Date.now() - cache.timestamp < PermissionManager.#CACHE_TTL) {
            PermissionManager.#stats.cacheHits++
            return cache
        }
        
        PermissionManager.#stats.cacheMisses++
        
        const isSuperAdmin = this._isSuperAdmin(player)
        if (isSuperAdmin) {
            cache = {
                permissions: new Map(),
                isSuperAdmin: true,
                timestamp: Date.now()
            }
            PermissionManager.#playerCache.set(player.id, cache)
            return cache
        }

        this.syncPlayerRanks(player)
        const permissions = this.#computePermissions(player)
        
        cache = {
            permissions,
            isSuperAdmin: false,
            timestamp: Date.now()
        }
        PermissionManager.#playerCache.set(player.id, cache)
        return cache
    }

    /*
     * VALUE_RETRIEVAL_VECTOR
     * Fetches the raw permission value (boolean or number) for a player.
     * Implements admin bypass mechanics where admins get Infinity limits and 0 cooldowns.
     */
    getPermission(player, key) {
        const cache = this._getOrComputeCache(player)
        
        const isAdmin = cache.isSuperAdmin || cache.permissions.get("admin") === true
        
        if (isAdmin) {
            if (key.endsWith(".limit") || key.includes("limit")) {
                return Infinity
            }
            if (key.endsWith(".cooldown") || key.includes("cooldown") || 
                key.endsWith(".wait") || key.includes("wait") || 
                key.endsWith(".cost") || key.includes("cost")) {
                return 0
            }
            return true
        }
        
        return cache.permissions.get(key)
    }

    hasPermission(player, permission) {
        PermissionManager.#stats.totalChecks++
        const val = this.getPermission(player, permission)
        return val ?? false
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
        
        const RankStore = Kernel.get("rankStore")
        const allRanks = RankStore ? RankStore.getAllRanks() : {}

        const resolveRankPermissionsRecursive = (rankId, visited = new Set()) => {
            if (visited.has(rankId)) return {}
            visited.add(rankId)

            const rankData = allRanks[rankId]
            if (!rankData) return {}

            const merged = {}
            if (rankData.inherits) {
                Object.assign(merged, resolveRankPermissionsRecursive(rankData.inherits, visited))
            }

            if (rankData.permissions) {
                for (const [perm, val] of Object.entries(rankData.permissions)) {
                    merged[perm] = val
                }
            }
            return merged
        }

        // SCAN_HIERARCHY: Highest rank takes priority
        for (const rankId of playerRanks) {
            const rankPerms = resolveRankPermissionsRecursive(rankId)
            
            for (const [perm, value] of Object.entries(rankPerms)) {
                if (permissions.has(perm)) continue

                // 3-STATE_LOGIC_RESOLUTION
                // 1 or true IS ALLOW
                // 2 or false IS DENY
                // 0 or null IS NO_ACTION (inherit)
                if (value === 1 || value === true) {
                    permissions.set(perm, true)
                } else if (value === 2 || value === false) {
                    permissions.set(perm, false)
                } else if (typeof value === 'number') {
                    permissions.set(perm, value)
                }
            }
        }
        
        // BASELINE_FALLBACK: If node is still unresolved, check the 'member' rank
        const memberRank = resolveRankPermissionsRecursive("member")
        for (const [perm, value] of Object.entries(memberRank)) {
            if (!permissions.has(perm)) {
                if (typeof value === 'number') {
                    if (value > 2) {
                        // Large number = numeric config (cooldown seconds, home limit, etc.) - store as-is
                        permissions.set(perm, value)
                    } else if (value === 1) {
                        permissions.set(perm, true)   // 1 = Allow
                    } else if (value === 2) {
                        permissions.set(perm, false)  // 2 = Deny
                    }
                } else if (typeof value === 'boolean') {
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

