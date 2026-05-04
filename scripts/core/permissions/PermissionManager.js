/**
 * Permission Manager - Cache-Aware High-Performance Permission System
 * Integrates with DOD PermissionData for optimal performance
 */

import { PermissionData } from "./PermissionData.js"
import { system } from "@minecraft/server"

export class PermissionManager {
    static #instance = null
    static #data = new PermissionData()
    static #playerCache = new Map() // playerId -> { permissions: Map, timestamp }
    static #CACHE_TTL = 5000 // 5 seconds
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
        this.initializeDefaultRanks()
        this.startCleanupTask()
    }
    
    /**
     * Initialize default rank system
     */
    initializeDefaultRanks() {
        // Add default ranks with proper hierarchy
        PermissionManager.#data.addRank("default", 0, "Default", "§7", "§7")
        PermissionManager.#data.addRank("member", 10, "Member", "§a", "§a")
        PermissionManager.#data.addRank("vip", 20, "VIP", "§6", "§6")
        PermissionManager.#data.addRank("mvp", 30, "MVP", "§b", "§b")
        PermissionManager.#data.addRank("helper", 40, "Helper", "§e", "§e")
        PermissionManager.#data.addRank("moderator", 50, "Moderator", "§2", "§2")
        PermissionManager.#data.addRank("admin", 100, "Admin", "§c", "§c")
        PermissionManager.#data.addRank("owner", 200, "Owner", "§4", "§4")
        
        // Set basic permissions
        this.setupBasicPermissions()
    }
    
    /**
     * Setup basic permission structure
     */
    setupBasicPermissions() {
        // Basic permissions
        this.setPermission("default", "essentials.chat", true)
        this.setPermission("default", "essentials.tp", false)
        this.setPermission("default", "essentials.fly", false)
        
        this.setPermission("member", "essentials.chat", true)
        this.setPermission("member", "essentials.tp", true)
        this.setPermission("member", "essentials.home", true)
        this.setPermission("member", "essentials.warp", true)
        
        this.setPermission("vip", "essentials.chat.color", true)
        this.setPermission("vip", "essentials.fly", true)
        this.setPermission("vip", "essentials.speed", 1.2)
        
        this.setPermission("mvp", "essentials.chat.color", true)
        this.setPermission("mvp", "essentials.fly", true)
        this.setPermission("mvp", "essentials.speed", 1.5)
        this.setPermission("mvp", "essentials.gamemode", true)
        
        this.setPermission("moderator", "essentials.kick", true)
        this.setPermission("moderator", "essentials.mute", true)
        this.setPermission("moderator", "essentials.tp.others", true)
        this.setPermission("moderator", "essentials.vanish", true)
        
        this.setPermission("admin", "essentials.ban", true)
        this.setPermission("admin", "essentials.admin", true)
        this.setPermission("admin", "essentials.*", true) // Wildcard permission
        
        this.setPermission("owner", "essentials.*", true)
        this.setPermission("owner", "essentials.server", true)
    }
    
    /**
     * Check if player has permission (with caching)
     * @param {Player} player - Player to check
     * @param {string} permission - Permission to check
     * @returns {boolean} Whether player has permission
     */
    hasPermission(player, permission) {
        PermissionManager.#stats.totalChecks++
        
        // Check cache first
        let cache = PermissionManager.#playerCache.get(player.id)
        if (cache && Date.now() - cache.timestamp < PermissionManager.#CACHE_TTL) {
            PermissionManager.#stats.cacheHits++
            return cache.permissions.get(permission) ?? false
        }
        
        // Cache miss - compute permissions
        PermissionManager.#stats.cacheMisses++
        const permissions = this.#computePermissions(player)
        
        // Update cache
        PermissionManager.#playerCache.set(player.id, {
            permissions,
            timestamp: Date.now()
        })
        
        return permissions.get(permission) ?? false
    }
    
    /**
     * Compute all permissions for a player
     * @param {Player} player - Player to compute permissions for
     * @returns {Map} Permission map
     */
    #computePermissions(player) {
        const permissions = new Map()
        const ranks = this.getPlayerRanks(player)
        
        // Process ranks in priority order (highest first)
        for (const rankId of ranks) {
            const rankPerms = PermissionManager.#data.getRankPermissions(rankId)
            
            // Merge permissions (higher ranks override lower ones)
            for (const [perm, value] of Object.entries(rankPerms)) {
                if (!permissions.has(perm) || value !== false) {
                    permissions.set(perm, value)
                }
            }
            
            // Handle wildcard permissions
            if (permissions.has("essentials.*")) {
                // Grant all essentials permissions
                permissions.set("essentials.chat", true)
                permissions.set("essentials.tp", true)
                permissions.set("essentials.home", true)
                permissions.set("essentials.warp", true)
                permissions.set("essentials.fly", true)
                permissions.set("essentials.shop", true)
                permissions.set("essentials.money", true)
            }
        }
        
        return permissions
    }
    
    /**
     * Get player's ranks (synced with player tags)
     * @param {Player} player - Player to check
     * @returns {string[]} Array of rank IDs
     */
    getPlayerRanks(player) {
        // Get ranks from player tags
        const tagRanks = player.getTags()
            .filter(tag => PermissionManager.#data.rankIds.includes(tag))
        
        // Sync with PermissionData
        PermissionManager.#data.setPlayerRanks(player.id, tagRanks)
        
        // Return sorted ranks from PermissionData
        return PermissionManager.#data.getPlayerRanks(player.id)
    }
    
    /**
     * Add rank to player
     * @param {Player} player - Player to add rank to
     * @param {string} rankId - Rank to add
     */
    addPlayerRank(player, rankId) {
        player.addTag(rankId)
        PermissionManager.#data.addPlayerRank(player.id, rankId)
        this.invalidatePlayerCache(player.id)
    }
    
    /**
     * Remove rank from player
     * @param {Player} player - Player to remove rank from
     * @param {string} rankId - Rank to remove
     */
    removePlayerRank(player, rankId) {
        player.removeTag(rankId)
        PermissionManager.#data.removePlayerRank(player.id, rankId)
        this.invalidatePlayerCache(player.id)
    }
    
    /**
     * Set permission for rank
     * @param {string} rankId - Rank identifier
     * @param {string} permission - Permission name
     * @param {any} value - Permission value
     */
    setPermission(rankId, permission, value) {
        return PermissionManager.#data.setPermission(rankId, permission, value)
    }
    
    /**
     * Get permission for rank
     * @param {string} rankId - Rank identifier
     * @param {string} permission - Permission name
     * @returns {any} Permission value
     */
    getPermission(rankId, permission) {
        return PermissionManager.#data.getPermission(rankId, permission)
    }
    
    /**
     * Get all ranks
     * @returns {Object[]} All rank data
     */
    getAllRanks() {
        return PermissionManager.#data.getAllRanks()
    }
    
    /**
     * Get rank info
     * @param {string} rankId - Rank identifier
     * @returns {Object} Rank data
     */
    getRankInfo(rankId) {
        return PermissionManager.#data.getRankInfo(rankId)
    }
    
    /**
     * Invalidate player cache
     * @param {string} playerId - Player ID (optional)
     */
    invalidatePlayerCache(playerId = null) {
        if (playerId) {
            PermissionManager.#playerCache.delete(playerId)
        } else {
            PermissionManager.#playerCache.clear()
        }
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance stats
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
    
    /**
     * Reset statistics
     */
    resetStats() {
        PermissionManager.#stats = {
            cacheHits: 0,
            cacheMisses: 0,
            totalChecks: 0
        }
    }
    
    /**
     * Start periodic cleanup task
     */
    startCleanupTask() {
        // Cleanup every 5 minutes
        system.runInterval(() => {
            PermissionManager.#data.cleanup()
            this.cleanupExpiredCache()
        }, 20 * 60 * 5)
    }
    
    /**
     * Cleanup expired cache entries
     */
    cleanupExpiredCache() {
        const now = Date.now()
        let cleaned = 0
        
        for (const [playerId, cache] of PermissionManager.#playerCache) {
            if (now - cache.timestamp > PermissionManager.#CACHE_TTL) {
                PermissionManager.#playerCache.delete(playerId)
                cleaned++
            }
        }
        
        if (cleaned > 0) {
            console.log(`PermissionManager: Cleaned ${cleaned} expired cache entries`)
        }
    }
}

// Export singleton instance
export const PermissionManagerInstance = PermissionManager.getInstance()

