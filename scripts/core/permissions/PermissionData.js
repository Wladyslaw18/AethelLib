/*
 * INDUSTRIAL_AUTH_MANIFEST (SoA_LAYOUT)
 * ----------------------------------------------------------------------------
 * A high-performance data-structure designed for low-latency permission 
 * resolution. Implements the 'Structure of Arrays' (SoA) pattern to maximize 
 * CPU cache-line hits and ensure deterministic data-locality.
 *
 * PHILOSOPHY: Object-oriented hierarchies are slow. Primitive arrays 
 * are fast. We use bitwise-sharding and BigInt masks to manage boolean 
 * permission nodes.
 */
export class PermissionData {
    constructor() {
        /* STRUCTURE_OF_ARRAYS (SoA) */
        this.rankIds = []           // IDENTIFIER_BUFFER
        this.rankOrders = []        // WEIGHT_BUFFER
        this.rankNames = []         // DISPLAY_BUFFER
        this.rankColors = []        // TOKEN_BUFFER
        this.rankChatColors = []    // CHAT_TOKEN_BUFFER

        /* AUTH_NODE_ARRAYS */
        this.permissionFlags = new Map()  // permission_id -> BigInt_Buffer (Bitflags)
        this.permissionValues = new Map()  // permission_id -> number_Buffer (Numeric Limits)

        /* VOLATILE_IDENTITY_CACHE */
        this.playerRanks = new Map()       // entity_id -> rank_list
        this.playerRankCache = new Map()   // entity_id -> {manifest, timestamp}
        this.CACHE_TTL = 5000 // 5s_TTL
    }

    /* 
     * RANK_INJECTION_PROTOCOL
     * Allocates a new index in the SoA manifest and initializes the 
     * permission-shards.
     */
    addRank(rankId, order, name, color, chatColor) {
        const index = this.rankIds.length

        this.rankIds.push(rankId)
        this.rankOrders.push(order)
        this.rankNames.push(name)
        this.rankColors.push(color)
        this.rankChatColors.push(chatColor)

        for (const [_perm, flags] of this.permissionFlags) {
            flags[index] = 0n
        }

        for (const [_perm, values] of this.permissionValues) {
            values[index] = 0
        }

        console.log(`[PermissionData] RANK_INJECTED: ${rankId} [IDX_${index}]`);
    }

    /* 
     * AUTH_NODE_CALIBRATION_VECTOR
     * Sets a permission bit or numeric value for a specific rank index.
     */
    setPermission(rankId, permission, value) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) return false

        if (typeof value === 'boolean') {
            let flags = this.permissionFlags.get(permission)
            if (!flags) {
                flags = new Array(this.rankIds.length).fill(0n)
                this.permissionFlags.set(permission, flags)
            }

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

        this.invalidatePlayerCache()
        return true
    }

    /* 
     * AUTH_NODE_QUERY_VECTOR
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

    /* 
     * RANK_MANIFEST_QUERY
     */
    getRankPermissions(rankId) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) return {}

        const permissions = {}
        for (const [perm, flags] of this.permissionFlags) {
            const bitMask = 1n << BigInt(index)
            permissions[perm] = (flags[index] & bitMask) !== 0n
        }
        for (const [perm, values] of this.permissionValues) {
            permissions[perm] = values[index]
        }
        return permissions
    }

    /* 
     * ENTITY_AUTH_RESOLUTION_ENGINE
     * Computes the effective permission for an entity by scanning its 
     * assigned ranks. O(R) where R is the number of ranks.
     */
    getPlayerPermission(playerId, permission) {
        const ranks = this.getPlayerRanks(playerId)
        if (!ranks.length) return false

        for (const rankId of ranks) {
            const value = this.getPermission(rankId, permission)
            if (value !== null && value !== false) {
                return value
            }
        }

        return false
    }

    /* 
     * ENTITY_MANIFEST_QUERY_PIPELINE
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

    /* 
     * HIERARCHY_COMPUTATION_PROTOCOL
     * Sorts entity ranks based on their industrial weight. O(N log N).
     */
    _computePlayerRanks(playerId) {
        const ranks = this.playerRanks.get(playerId) || []

        return ranks
            .filter(rankId => {
                const idx = this.rankIds.indexOf(rankId)
                return idx !== -1
            })
            .sort((a, b) => {
                const indexA = this.rankIds.indexOf(a)
                const indexB = this.rankIds.indexOf(b)
                return this.rankOrders[indexB] - this.rankOrders[indexA]
            })
    }

    /* 
     * PEAK_CLEARANCE_RESOLVER
     */
    getHighestRank(playerId) {
        const ranks = this.getPlayerRanks(playerId)
        if (ranks.length === 0) return null
        return this.getRankInfo(ranks[0])
    }

    /* 
     * HIERARCHY_VALIDATION_GATE
     */
    canActOn(actorId, targetId) {
        const actorHighest = this.getHighestRank(actorId)
        const targetHighest = this.getHighestRank(targetId)

        if (!actorHighest) return false
        if (!targetHighest) return true 

        return actorHighest.order > targetHighest.order
    }

    /* 
     * IDENTITY_CALIBRATION_VECTOR
     */
    setPlayerRanks(playerId, rankIds) {
        this.playerRanks.set(playerId, [...rankIds])
        this.invalidatePlayerCache(playerId)
    }

    /* 
     * VOLATILE_BUFFER_TERMINATION
     */
    invalidatePlayerCache(playerId = null) {
        if (playerId) {
            this.playerRankCache.delete(playerId)
        } else {
            this.playerRankCache.clear()
        }
    }

    /* 
     * MANIFEST_DATA_ACCESSOR
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

    /* 
     * GLOBAL_HIERARCHY_QUERY
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
        return ranks.sort((a, b) => b.order - a.order) 
    }

    /* 
     * RANK_DECOMMISSION_PROTOCOL
     * Splicing from the SoA arrays to remove a rank from the entire 
     * industrial manifest.
     */
    removeRank(rankId) {
        const index = this.rankIds.indexOf(rankId)
        if (index === -1) return false

        this.rankIds.splice(index, 1)
        this.rankOrders.splice(index, 1)
        this.rankNames.splice(index, 1)
        this.rankColors.splice(index, 1)
        this.rankChatColors.splice(index, 1)

        for (const flags of this.permissionFlags.values()) {
            flags.splice(index, 1)
        }
        for (const values of this.permissionValues.values()) {
            values.splice(index, 1)
        }

        this.invalidatePlayerCache()
        return true
    }

    /* 
     * ANALYTICS_VECTOR
     */
    getStats() {
        return {
            totalRanks: this.rankIds.length,
            totalPermissions: this.permissionFlags.size + this.permissionValues.size,
            cachedPlayers: this.playerRankCache.size,
            totalPlayers: this.playerRanks.size
        }
    }

    /* 
     * MAINTENANCE_SANITIZATION_PROTOCOL
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
            console.log(`[PermissionData] SANITIZATION: ${cleaned} stale cache-entries purged.`);
        }
    }
}
