import { WorldStore } from "../../core/store/WorldStore.js"

// Chunk claim persistence with cache-aside strategy and player index.

const claimCache = new Map()
const CACHE_TTL = 300000 // 5m

export const ClaimStore = {
    locationToChunkKey(location) {
        const chunkX = Math.floor(location.x >> 4)
        const chunkZ = Math.floor(location.z >> 4)
        return `${chunkX},${chunkZ}`
    },

    getClaim(chunkKey) {
        const cached = claimCache.get(chunkKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data
        }

        const stored = WorldStore.get(`claim:${chunkKey}`)
        if (stored) {
            claimCache.set(chunkKey, {
                data: stored,
                timestamp: Date.now()
            })
            return stored
        }

        return null
    },

    setClaim(chunkKey, claimData) {
        claimCache.set(chunkKey, {
            data: claimData,
            timestamp: Date.now()
        })

        WorldStore.set(`claim:${chunkKey}`, claimData)

        const indexKey = `playerClaims:${claimData.ownerId}`
        const index = WorldStore.get(indexKey) || []
        if (!index.includes(chunkKey)) {
            index.push(chunkKey)
            WorldStore.set(indexKey, index)
        }
    },

    removeClaim(chunkKey) {
        const claim = this.getClaim(chunkKey)
        if (claim) {
            const indexKey = `playerClaims:${claim.ownerId}`
            let index = WorldStore.get(indexKey) || []
            index = index.filter(k => k !== chunkKey)
            WorldStore.set(indexKey, index)
        }

        claimCache.delete(chunkKey)
        WorldStore.delete(`claim:${chunkKey}`)
    },

    isOwner(chunkKey, playerId) {
        const claim = this.getClaim(chunkKey)
        return claim?.ownerId === playerId
    },

    hasPermission(chunkKey, playerId, permission) {
        const claim = this.getClaim(chunkKey)
        if (!claim) return false

        if (claim.ownerId === playerId) return true

        return (claim.trusted?.[playerId] & permission) === permission
    },

    addTrusted(chunkKey, ownerId, trustedId, permissions) {
        const claim = this.getClaim(chunkKey) || {
            ownerId,
            trusted: {},
            flags: 0
        }

        claim.trusted[trustedId] = permissions
        this.setClaim(chunkKey, claim)
    },

    removeTrusted(chunkKey, trustedId) {
        const claim = this.getClaim(chunkKey)
        if (claim?.trusted) {
            delete claim.trusted[trustedId]
            this.setClaim(chunkKey, claim)
        }
    },

    getPlayerClaims(playerId) {
        const indexKey = `playerClaims:${playerId}`
        const index = WorldStore.get(indexKey) || []
        
        return index.map(chunkKey => ({
            chunkKey,
            ...this.getClaim(chunkKey)
        })).filter(c => c.ownerId === playerId)
    },

    cleanup() {
        const now = Date.now()
        for (const [key, value] of claimCache.entries()) {
            if (now - value.timestamp >= CACHE_TTL) {
                claimCache.delete(key)
            }
        }
    }
}
