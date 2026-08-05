/**
 * Stores and manages rank and permission data using a Structure of Arrays (SoA) layout.
 * This ensures high performance for permission lookups.
 */
export class PermissionData {
    /**
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Allocates core rank data Structure of Arrays (Ids, Orders, Names, Colors, ChatColors, ShouldHideRanks).
     * - Initializes bitflag Maps for permission flags and values.
     * - Prepares in-memory caches for player rank lookups and sets CACHE_TTL.
     */
    constructor() {
        // Core rank data arrays
        this.rankIds = []           
        this.rankOrders = []        
        this.rankNames = []         
        this.rankColors = []        
        this.rankChatColors = []    
        this.rankShouldHideRanks = []
        this.rankIndexMap = new Map() // O(1) lookup for rank indices

        // Bitflag maps for permissions
        this.permissionFlags = new Map()  
        this.permissionValues = new Map()  

        // Cache for player rank resolutions
        this.playerRanks = new Map()       
        this.playerRankCache = new Map()   
        this.CACHE_TTL = 5000 
    }

    /**
     * Add a new rank to the data structure.
     * 
     * EXPECTS:
     * - rankId: Unique string identifying the rank.
     * - order: Numeric weight order representing hierarchical position.
     * - name: Display name of the rank.
     * - color: Color formatting code for display.
     * - chatColor: Color formatting code for player chat.
     * - shouldHideRanks: Boolean indicating if other ranks should be hidden.
     * 
     * GUARANTEES:
     * - Registers rank details into the SoA arrays and maps the index.
     * - Automatically fills flags/values arrays for this rank index with null.
     */
    addRank(rankId, order, name, color, chatColor, shouldHideRanks = false) {
        if (this.rankIndexMap.has(rankId)) return

        const index = this.rankIds.length
        this.rankIndexMap.set(rankId, index)

        this.rankIds.push(rankId)
        this.rankOrders.push(order)
        this.rankNames.push(name)
        this.rankColors.push(color)
        this.rankChatColors.push(chatColor)
        this.rankShouldHideRanks.push(shouldHideRanks)

        for (const [_perm, flags] of this.permissionFlags) {
            flags[index] = null
        }

        for (const [_perm, values] of this.permissionValues) {
            values[index] = null
        }

        console.log(`[PermissionData] RANK_INJECTED: ${rankId} [IDX_${index}]`);
    }

    /**
     * Sets a permission flag or numeric value for a specific rank.
     * 
     * EXPECTS:
     * - rankId: Unique identifier of the rank.
     * - permission: String path of permission node.
     * - value: Boolean for permission flag, or number/string for permission value.
     * 
     * GUARANTEES:
     * - Writes the value into the correct permissionFlags or permissionValues array at the rank's index.
     * - Clears player rank caches.
     * - Returns true on success, false if rank is not found.
     * 
     * @param {string} rankId - Target rank ID.
     * @param {string} permission - Permission node.
     * @param {boolean|number|string} value - Setting value.
     * @returns {boolean} True if successfully set.
     */
    setPermission(rankId, permission, value) {
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return false

        const setVal = (perm) => {
            if (typeof value === 'boolean') {
                let flags = this.permissionFlags.get(perm)
                if (!flags) {
                    flags = new Array(this.rankIds.length).fill(null)
                    this.permissionFlags.set(perm, flags)
                }
                flags[index] = value ? 1 : 0

                // Clean up cross-type value entry to avoid masking bugs
                const values = this.permissionValues.get(perm)
                if (values) {
                    values[index] = null
                }
            } else {
                let values = this.permissionValues.get(perm)
                if (!values) {
                    values = new Array(this.rankIds.length).fill(null)
                    this.permissionValues.set(perm, values)
                }
                values[index] = value

                // Clean up cross-type flag entry to avoid masking bugs
                const flags = this.permissionFlags.get(perm)
                if (flags) {
                    flags[index] = null
                }
            }
        }

        setVal(permission)

        this.invalidatePlayerCache()
        return true
    }

    /**
     * Retrieves the permission flag or value set for a rank.
     * 
     * EXPECTS:
     * - rankId: Unique identifier of the rank.
     * - permission: String permission node name.
     * 
     * GUARANTEES:
     * - Returns boolean value if permission is registered as flag.
     * - Returns number or string value if permission is registered as numeric limit/value.
     * - Returns null if the permission or rank is not found.
     * 
     * @param {string} rankId - Rank ID.
     * @param {string} permission - Permission node.
     * @returns {boolean|number|string|null} Resolved setting value.
     */
    getPermission(rankId, permission) {
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return null

        const flags = this.permissionFlags.get(permission)
        if (flags && flags[index] !== null && flags[index] !== undefined) {
            return flags[index] === 1
        }

        const values = this.permissionValues.get(permission)
        if (values && values[index] !== null && values[index] !== undefined) {
            return values[index]
        }

        return null
    }

    /**
     * Gets all custom permissions set on a specific rank.
     * 
     * EXPECTS:
     * - rankId: Unique identifier of the rank.
     * 
     * GUARANTEES:
     * - Returns an object containing all permission mappings for this rank.
     * 
     * @param {string} rankId - Rank ID.
     * @returns {Object} Mapped permissions object.
     */
    getRankPermissions(rankId) {
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return {}

        const permissions = {}
        for (const [perm, flags] of this.permissionFlags) {
            if (flags[index] !== null && flags[index] !== undefined) {
                permissions[perm] = flags[index] === 1
            }
        }
        for (const [perm, values] of this.permissionValues) {
            if (values[index] !== null && values[index] !== undefined) {
                permissions[perm] = values[index]
            }
        }
        return permissions
    }

    /**
     * Gets the sorted list of ranks assigned to a player.

     * 
     * EXPECTS:
     * - playerId: Unique string player ID.
     * 
     * GUARANTEES:
     * - Checks player rank cache. If cached and TTL is valid, returns cached ranks.
     * - Computes ranks and updates the player cache if missing/expired.
     * 
     * @param {string} playerId - Player ID.
     * @returns {string[]} List of sorted rank IDs.
     */
    getPlayerRanks(playerId) {
        const cached = this.playerRankCache.get(playerId)
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.ranks
        }

        const ranks = this._computePlayerRanks(playerId)
        this.playerRankCache.set(playerId, {
            ranks,
            timestamp: Date.now()
        })
        return ranks
    }

    /**
     * Computes player ranks sorted by hierarchical order weight.
     * 
     * EXPECTS:
     * - playerId: Unique string player ID.
     * 
     * GUARANTEES:
     * - Filters player rank list to keep only valid ranks in SoA registry.
     * - Sorts ranks descending based on hierarchy orders.
     */
    _computePlayerRanks(playerId) {
        const ranks = this.playerRanks.get(playerId) || []

        return ranks
            .filter(rankId => {
                return this.rankIndexMap.has(rankId)
            })
            .sort((a, b) => {
                const indexA = this.rankIndexMap.get(a)
                const indexB = this.rankIndexMap.get(b)
                return this.rankOrders[indexB] - this.rankOrders[indexA]
            })
    }

    /**
     * Resolves the highest hierarchy rank for a player.
     * 
     * EXPECTS:
     * - playerId: Unique string player ID.
     * 
     * GUARANTEES:
     * - Returns the highest priority rank info payload, or null if player has no ranks.
     * 
     * @param {string} playerId - Player ID.
     * @returns {Object|null} Highest rank details.
     */
    getHighestRank(playerId) {
        const ranks = this.getPlayerRanks(playerId)
        if (ranks.length === 0) return null
        return this.getRankInfo(ranks[0])
    }

    /**
     * Evaluates if one player can act on another hierarchy-wise.
     * 
     * EXPECTS:
     * - actorId: Player ID of the executor.
     * - targetId: Player ID of the target.
     * 
     * GUARANTEES:
     * - Returns true if the actor has a higher rank order weight than the target.
     * - Returns true if target has no rank, false if actor has no rank.
     * 
     * @param {string} actorId - Actor player ID.
     * @param {string} targetId - Target player ID.
     * @returns {boolean} True if action is permitted.
     */
    canActOn(actorId, targetId) {
        const actorHighest = this.getHighestRank(actorId)
        const targetHighest = this.getHighestRank(targetId)

        if (!actorHighest) return false
        if (!targetHighest) return true 

        return actorHighest.order > targetHighest.order
    }

    /**
     * Commits a list of assigned rank IDs for a player.
     * 
     * EXPECTS:
     * - playerId: Unique string player ID.
     * - rankIds: Array of string rank IDs.
     * 
     * GUARANTEES:
     * - Overwrites player ranks assignment registry and invalidates player rank cache.
     * 
     * @param {string} playerId - Player ID.
     * @param {string[]} rankIds - List of rank IDs to assign.
     */
    setPlayerRanks(playerId, rankIds) {
        this.playerRanks.set(playerId, [...rankIds])
        this.invalidatePlayerCache(playerId)
    }

    /**
     * Clears cached player rank mappings.
     * 
     * EXPECTS:
     * - playerId: (Optional) Specific player ID to clear.
     * 
     * GUARANTEES:
     * - Wipes player rank cache for player if playerId is specified.
     * - Clears entire player rank cache if playerId is null.
     * 
     * @param {string} [playerId=null] - Player ID.
     */
    invalidatePlayerCache(playerId = null) {
        if (playerId) {
            this.playerRankCache.delete(playerId)
        } else {
            this.playerRankCache.clear()
        }
    }

    /**
     * Purges all trace of a player's ranks assignments and rank caches from memory.
     * 
     * EXPECTS:
     * - playerId: Unique string player ID.
     * 
     * GUARANTEES:
     * - Deletes playerId from playerRanks map.
     * - Deletes playerId from playerRankCache map.
     * 
     * @param {string} playerId - Player ID.
     */
    purgePlayer(playerId) {
        if (!playerId) return
        this.playerRanks.delete(playerId)
        this.playerRankCache.delete(playerId)
    }


    /**
     * Gathers configuration settings for a rank ID.
     * 
     * EXPECTS:
     * - rankId: Unique identifier of rank.
     * 
     * GUARANTEES:
     * - Returns complete rank info payload containing metadata, colors, and permissions.
     * - Returns null if rank is not found.
     * 
     * @param {string} rankId - Rank ID.
     * @returns {Object|null} Rank configuration payload.
     */
    getRankInfo(rankId) {
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return null

        return {
            id: rankId,
            order: this.rankOrders[index],
            name: this.rankNames[index],
            color: this.rankColors[index],
            chatColor: this.rankChatColors[index],
            hideRanks: this.rankShouldHideRanks[index] ?? false,
            permissions: this.getRankPermissions(rankId)
        }
    }

    /**
     * Gets all ranks sorted by hierarchy order.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Returns array of all rank payloads sorted descending by order.
     * 
     * @returns {Object[]} Sorted rank payloads array.
     */
    getAllRanks() {
        const ranks = []
        for (let i = 0; i < this.rankIds.length; i++) {
            ranks.push({
                id: this.rankIds[i],
                order: this.rankOrders[i],
                name: this.rankNames[i],
                color: this.rankColors[i],
                chatColor: this.rankChatColors[i],
                hideRanks: this.rankShouldHideRanks[i] ?? false,
                permissions: this.getRankPermissions(this.rankIds[i])
            })
        }
        return ranks.sort((a, b) => b.order - a.order) 
    }

    /**
     * Deletes a rank from the Structure of Arrays.
     * 
     * EXPECTS:
     * - rankId: Unique identifier of rank to delete.
     * 
     * GUARANTEES:
     * - Splices SoA arrays at the rank's index to remove it.
     * - Re-indexes all remaining ranks to preserve SoA mappings.
     * - Splices flags and values permission arrays.
     * - Clears player rank caches.
     * - Returns true on success, false if rank is not found.
     * 
     * @param {string} rankId - Rank ID to remove.
     * @returns {boolean} True if successfully removed.
     */
    removeRank(rankId) {
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return false

        this.rankIds.splice(index, 1)
        this.rankOrders.splice(index, 1)
        this.rankNames.splice(index, 1)
        this.rankColors.splice(index, 1)
        this.rankChatColors.splice(index, 1)
        this.rankShouldHideRanks.splice(index, 1)
        this.rankIndexMap.delete(rankId)

        // Re-index remaining ranks
        for (let i = index; i < this.rankIds.length; i++) {
            this.rankIndexMap.set(this.rankIds[i], i)
        }

        for (const flags of this.permissionFlags.values()) {
            flags.splice(index, 1)
        }
        for (const values of this.permissionValues.values()) {
            values.splice(index, 1)
        }

        this.invalidatePlayerCache()
        return true
    }

    /**
     * Collects statistics metrics on the database structure.
     */
    getStats() {
        return {
            totalRanks: this.rankIds.length,
            totalPermissions: this.permissionFlags.size + this.permissionValues.size,
            cachedPlayers: this.playerRankCache.size,
            totalPlayers: this.playerRanks.size
        }
    }

    /**
     * Clears stale player rank cache entries that exceed CACHE_TTL.
     * Optimized O(N) mutation-safe sweep for QuickJS engine.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Identifies and removes expired items from the cache Map.
     * - Logs count of cleared stale cache items.
     */
    cleanup() {
        const now = Date.now()
        const keysToDelete = []

        for (const [playerId, cache] of this.playerRankCache) {
            if (now - cache.timestamp > this.CACHE_TTL) {
                keysToDelete.push(playerId)
            }
        }

        for (const playerId of keysToDelete) {
            this.playerRankCache.delete(playerId)
        }

        if (keysToDelete.length > 0) {
            console.log(`[PermissionData] SANITIZATION: ${keysToDelete.length} stale cache-entries purged.`);
        }
    }
}
