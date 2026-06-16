/**
 * Stores and manages rank and permission data using a Structure of Arrays (SoA) layout.
 * This ensures high performance for permission lookups.
 */
export class PermissionData {
    constructor() {
        // Core rank data arrays
        this.rankIds = []           
        this.rankOrders = []        
        this.rankNames = []         
        this.rankColors = []        
        this.rankChatColors = []    
        this.rankHideRanks = []
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
     * Add a new rank to the data structure
     */
    addRank(rankId, order, name, color, chatColor, hideRanks = false) {
        if (this.rankIndexMap.has(rankId)) return

        const index = this.rankIds.length
        this.rankIndexMap.set(rankId, index)

        this.rankIds.push(rankId)
        this.rankOrders.push(order)
        this.rankNames.push(name)
        this.rankColors.push(color)
        this.rankChatColors.push(chatColor)
        this.rankHideRanks.push(hideRanks)

        for (const [_perm, flags] of this.permissionFlags) {
            flags[index] = 0
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
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return false

        const setVal = (perm) => {
            if (typeof value === 'boolean') {
                let flags = this.permissionFlags.get(perm)
                if (!flags) {
                    flags = new Array(this.rankIds.length).fill(0)
                    this.permissionFlags.set(perm, flags)
                }
                flags[index] = value ? 1 : 0
            } else {
                let values = this.permissionValues.get(perm)
                if (!values) {
                    values = new Array(this.rankIds.length).fill(0)
                    this.permissionValues.set(perm, values)
                }
                values[index] = value
            }
        }

        setVal(permission)

        const parts = permission.split('.')
        if (parts.length === 2) {
            setVal(`${parts[1]}.${parts[0]}`)
        }

        this.invalidatePlayerCache()
        return true
    }

    /* 
     * AUTH_NODE_QUERY_VECTOR
     */
    getPermission(rankId, permission) {
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return null

        const flags = this.permissionFlags.get(permission)
        if (flags) {
            return flags[index] === 1
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
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return {}

        const permissions = {}
        for (const [perm, flags] of this.permissionFlags) {
            permissions[perm] = flags[index] === 1
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
                return this.rankIndexMap.has(rankId)
            })
            .sort((a, b) => {
                const indexA = this.rankIndexMap.get(a)
                const indexB = this.rankIndexMap.get(b)
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
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return null

        return {
            id: rankId,
            order: this.rankOrders[index],
            name: this.rankNames[index],
            color: this.rankColors[index],
            chatColor: this.rankChatColors[index],
            hideRanks: this.rankHideRanks[index] ?? false,
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
                hideRanks: this.rankHideRanks[i] ?? false,
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
        const index = this.rankIndexMap.get(rankId)
        if (index === undefined) return false

        this.rankIds.splice(index, 1)
        this.rankOrders.splice(index, 1)
        this.rankNames.splice(index, 1)
        this.rankColors.splice(index, 1)
        this.rankChatColors.splice(index, 1)
        this.rankHideRanks.splice(index, 1)
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

