/**
 * Permission Data - Data-Oriented Design with Structure of Arrays (SoA)
 * Cache-friendly bit flags and arrays for high-performance permission checks
 */

export class PermissionData {
    constructor() {
        // Structure of Arrays (SoA) - cache-friendly layout
        this.rankIds = []           // string[] - Rank identifiers
        this.rankOrders = []        // number[] - Priority orders
        this.rankNames = []         // string[] - Display names
        this.rankColors = []        // string[] - Default chat colors
        this.rankChatColors = []    // string[] - Chat color codes

        // Permission arrays using bit flags for boolean permissions
        this.permissionFlags = new Map()  // permissionName -> BigInt[]
        this.permissionValues = new Map()  // permissionName -> number[]

        // Enhanced player rank cache for faster lookups
        this.playerRanks = new Map()       // playerId -> string[]
        this.playerRankCache = new Map()   // playerId -> {ranks, timestamp}
        this.CACHE_TTL = 5000 // 5 seconds
    }

    /**
     * Add a new rank to the system
     * @param {string} rankId - Rank identifier
     * @param {number} order - Priority order (higher = more powerful)
     * @param {string} name - Display name
     * @param {string} color - Default color
     * @param {string} chatColor - Chat color code
     */
    addRank(rankId, order, name, color, chatColor) {
        const index = this.rankIds.length

        this.rankIds.push(rankId)
        this.rankOrders.push(order)
        this.rankNames.push(name)
        this.rankColors.push(color)
        this.rankChatColors.push(chatColor)

        // Initialize permission bits for new rank
        for (const [perm, flags] of this.permissionFlags) {
            flags[index] = 0n
        }

        for (const [perm, values] of this.permissionValues) {
            values[index] = 0
        }

        console.log(`Added rank: ${rankId} at index ${index}`)
    }

    /**
     * Set a permission for a rank
     * @param {string} rankId - Rank identifier
     * @param {string} permission - Permission name
     * @param {any} value - Permission value (boolean or number)
     */
    setPermission(rankId, permission, value) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) {
            console.warn(`Rank not found: ${rankId}`)
            return false
        }

        if (typeof value === 'boolean') {
            let flags = this.permissionFlags.get(permission)
            if (!flags) {
                flags = new Array(this.rankIds.length).fill(0n)
                this.permissionFlags.set(permission, flags)
            }

            // Set bit at index position using bit flag
            const bitMask = 1n << BigInt(index)
            if (value) {
                flags[index] |= bitMask
            } else {
                flags[index] &= ~bitMask
            }
        } else {
            let values = this.permissionValues.get(permission)
            if (!values) {
                values = new Array(this.rankIds.length).fill(0)
                this.permissionValues.set(permission, values)
            }
            values[index] = value
        }

        // Invalidate player cache when permissions change
        this.invalidatePlayerCache()

        return true
    }

    /**
     * Get a permission for a rank
     * @param {string} rankId - Rank identifier
     * @param {string} permission - Permission name
     * @returns {any} Permission value or null
     */
    getPermission(rankId, permission) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) return null

        const flags = this.permissionFlags.get(permission)
        if (flags) {
            const bitMask = 1n << BigInt(index)
            return (flags[index] & bitMask) !== 0n
        }

        const values = this.permissionValues.get(permission)
        if (values) {
            return values[index]
        }

        return null
    }

    /**
     * Get all permissions for a rank (optimized)
     * @param {string} rankId - Rank identifier
     * @returns {Object} All permissions for the rank
     */
    getRankPermissions(rankId) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) return {}

        const permissions = {}

        // Check boolean permissions (bit flags)
        for (const [perm, flags] of this.permissionFlags) {
            const bitMask = 1n << BigInt(index)
            permissions[perm] = (flags[index] & bitMask) !== 0n
        }

        // Check numeric permissions
        for (const [perm, values] of this.permissionValues) {
            permissions[perm] = values[index]
        }

        return permissions
    }

    /**
     * Get player's effective permission (checks all ranks)
     * @param {string} playerId - Player identifier
     * @param {string} permission - Permission name
     * @returns {any} Permission value
     */
    getPlayerPermission(playerId, permission) {
        const ranks = this.getPlayerRanks(playerId)
        if (!ranks.length) return false

        // Check highest priority rank first (cache-friendly sequential access)
        for (const rankId of ranks) {
            const value = this.getPermission(rankId, permission)
            if (value !== null && value !== false) {
                return value
            }
        }

        return false
    }

    /**
     * Get player's ranks (with enhanced caching)
     * @param {string} playerId - Player identifier
     * @returns {string[]} Array of rank IDs sorted by priority
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
     * Compute player ranks from stored data
     * @param {string} playerId - Player identifier
     * @returns {string[]} Sorted array of rank IDs
     */
    _computePlayerRanks(playerId) {
        const ranks = this.playerRanks.get(playerId) || []

        // Sort by order (highest priority first)
        return ranks
            .filter(rankId => this.rankIds.includes(rankId))
            .sort((a, b) => {
                const indexA = this.rankIds.indexOf(a)
                const indexB = this.rankIds.indexOf(b)
                return this.rankOrders[indexB] - this.rankOrders[indexA] // Descending order
            })
    }

    /**
     * Set player's ranks
     * @param {string} playerId - Player identifier
     * @param {string[]} rankIds - Array of rank IDs
     */
    setPlayerRanks(playerId, rankIds) {
        this.playerRanks.set(playerId, [...rankIds])
        this.invalidatePlayerCache(playerId)
    }

    /**
     * Add rank to player
     * @param {string} playerId - Player identifier
     * @param {string} rankId - Rank identifier
     */
    addPlayerRank(playerId, rankId) {
        const currentRanks = this.playerRanks.get(playerId) || []
        if (!currentRanks.includes(rankId)) {
            currentRanks.push(rankId)
            this.playerRanks.set(playerId, currentRanks)
            this.invalidatePlayerCache(playerId)
        }
    }

    /**
     * Remove rank from player
     * @param {string} playerId - Player identifier
     * @param {string} rankId - Rank identifier
     */
    removePlayerRank(playerId, rankId) {
        const currentRanks = this.playerRanks.get(playerId) || []
        const index = currentRanks.indexOf(rankId)
        if (index !== -1) {
            currentRanks.splice(index, 1)
            this.playerRanks.set(playerId, currentRanks)
            this.invalidatePlayerCache(playerId)
        }
    }

    /**
     * Invalidate player cache
     * @param {string} playerId - Specific player ID (optional)
     */
    invalidatePlayerCache(playerId = null) {
        if (playerId) {
            this.playerRankCache.delete(playerId)
        } else {
            this.playerRankCache.clear()
        }
    }

    /**
     * Get rank information
     * @param {string} rankId - Rank identifier
     * @returns {Object} Rank data
     */
    getRankInfo(rankId) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) return null

        return {
            id: rankId,
            order: this.rankOrders[index],
            name: this.rankNames[index],
            color: this.rankColors[index],
            chatColor: this.rankChatColors[index],
            permissions: this.getRankPermissions(rankId)
        }
    }

    /**
     * Get all ranks
     * @returns {Object[]} All rank data
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
                permissions: this.getRankPermissions(this.rankIds[i])
            })
        }
        return ranks.sort((a, b) => b.order - a.order) // Descending order
    }

    /**
     * Remove a rank from the system
     * @param {string} rankId - Rank identifier
     */
    removeRank(rankId) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) return false

        // Remove from all arrays
        this.rankIds.splice(index, 1)
        this.rankOrders.splice(index, 1)
        this.rankNames.splice(index, 1)
        this.rankColors.splice(index, 1)
        this.rankChatColors.splice(index, 1)

        // Remove from permission arrays
        for (const flags of this.permissionFlags.values()) {
            flags.splice(index, 1)
        }

        for (const values of this.permissionValues.values()) {
            values.splice(index, 1)
        }

        // Remove from all players
        for (const [playerId, ranks] of this.playerRanks) {
            const rankIndex = ranks.indexOf(rankId)
            if (rankIndex !== -1) {
                ranks.splice(rankIndex, 1)
            }
        }

        // Invalidate cache
        this.invalidatePlayerCache()

        console.log(`Removed rank: ${rankId}`)
        return true
    }

    /**
     * Get system statistics
     * @returns {Object} Performance and usage stats
     */
    getStats() {
        return {
            totalRanks: this.rankIds.length,
            totalPermissions: this.permissionFlags.size + this.permissionValues.size,
            cachedPlayers: this.playerRankCache.size,
            totalPlayers: this.playerRanks.size,
            cacheHitRate: this.calculateCacheHitRate()
        }
    }

    /**
     * Calculate cache hit rate (simplified)
     * @returns {number} Cache hit rate percentage
     */
    calculateCacheHitRate() {
        // This would need actual hit/miss tracking in production
        return this.playerRankCache.size > 0 ? 85 : 0 // Placeholder
    }

    /**
     * Cleanup expired cache entries
     */
    cleanup() {
        const now = Date.now()
        let cleaned = 0

        for (const [playerId, cache] of this.playerRankCache) {
            if (now - cache.timestamp > this.CACHE_TTL) {
                this.playerRankCache.delete(playerId)
                cleaned++
            }
        }

        if (cleaned > 0) {
            console.log(`Cleaned ${cleaned} expired player cache entries`)
        }
    }
}
