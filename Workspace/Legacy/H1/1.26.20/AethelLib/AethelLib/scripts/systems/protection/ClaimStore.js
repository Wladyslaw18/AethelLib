import { WorldStore } from "../../core/store/WorldStore.js"

/*
 * INDUSTRIAL_SPATIAL_REGISTRY
 * ----------------------------------------------------------------------------
 * A high-performance persistence layer for managing spatial-integrity 
 * contracts (claims). Implements a cache-aside strategy with JS Map 
 * buffers to minimize expensive Dynamic Property reads. 
 *
 * PHILOSOPHY: Land is a resource. If it's not registered, it's not protected. 
 * Use the locationToChunkKey protocol to resolve spatial coordinates to 
 * industrial identifiers.
 */

const claimCache = new Map() // VOLATILE_SPATIAL_BUFFER
const CACHE_TTL = 300000 // BUFFER_EXPIRATION_TTL (5m)

export const ClaimStore = {
    /* 
     * SPATIAL_RESOLUTION_PROTOCOL
     * Performs a bitwise shift to resolve block-coordinates to chunk-level 
     * identifiers. O(1) efficiency.
     */
    locationToChunkKey(location) {
        const chunkX = Math.floor(location.x >> 4)
        const chunkZ = Math.floor(location.z >> 4)
        return `${chunkX},${chunkZ}`
    },

    /* 
     * MANIFEST_QUERY_PIPELINE
     * Attempts a cache-hit before falling back to the WorldStore 
     * persistence layer.
     */
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

    /* 
     * MANIFEST_COMMIT_PROTOCOL
     * Synchronizes the in-memory buffer with the persistent registry. 
     * Updates the player-index to maintain O(1) reverse-lookup capability.
     */
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

    /* 
     * MANIFEST_DECOMMISSION_PROTOCOL
     */
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

    /* 
     * OWNERSHIP_VALIDATION_GATE
     */
    isOwner(chunkKey, playerId) {
        const claim = this.getClaim(chunkKey)
        return claim?.ownerId === playerId
    },

    /* 
     * AUTH_CLEARANCE_VALIDATOR
     * Resolves the permission bitmask for a specific entity within the 
     * target spatial buffer.
     */
    hasPermission(chunkKey, playerId, permission) {
        const claim = this.getClaim(chunkKey)
        if (!claim) return false

        if (claim.ownerId === playerId) return true

        return (claim.trusted?.[playerId] & permission) === permission
    },

    /* 
     * TRUST_PROFILE_INJECTION
     */
    addTrusted(chunkKey, ownerId, trustedId, permissions) {
        const claim = this.getClaim(chunkKey) || {
            ownerId,
            trusted: {},
            flags: 0
        }

        claim.trusted[trustedId] = permissions
        this.setClaim(chunkKey, claim)
    },

    /* 
     * TRUST_PROFILE_DECOMMISSION
     */
    removeTrusted(chunkKey, trustedId) {
        const claim = this.getClaim(chunkKey)
        if (claim?.trusted) {
            delete claim.trusted[trustedId]
            this.setClaim(chunkKey, claim)
        }
    },

    /* 
     * ENTITY_MANIFEST_QUERY
     */
    getPlayerClaims(playerId) {
        const indexKey = `playerClaims:${playerId}`
        const index = WorldStore.get(indexKey) || []
        
        return index.map(chunkKey => ({
            chunkKey,
            ...this.getClaim(chunkKey)
        })).filter(c => c.ownerId === playerId)
    },

    /* 
     * CACHE_SANITIZATION_PROTOCOL
     */
    cleanup() {
        const now = Date.now()
        for (const [key, value] of claimCache.entries()) {
            if (now - value.timestamp >= CACHE_TTL) {
                claimCache.delete(key)
            }
        }
    }
}
