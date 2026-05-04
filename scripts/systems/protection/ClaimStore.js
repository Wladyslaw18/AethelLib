/**
 * Claim Store - Data-Oriented Design chunk protection storage
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { WorldStore } from "../../core/store/WorldStore.js"

// In-memory cache for performance (Structure of Arrays)
const claimCache = new Map()
const CACHE_TTL = 300000 // 5 minutes in ms

/**
 * Convert block location to chunk key
 * @param {Vector3} location - Block location
 * @returns {string} Chunk key in "x,z" format
 */
export function locationToChunkKey(location) {
    const chunkX = Math.floor(location.x >> 4)
    const chunkZ = Math.floor(location.z >> 4)
    return `${chunkX},${chunkZ}`
}

/**
 * Get claim data from cache or storage
 * @param {string} chunkKey - Chunk key
 * @returns {Object|null} Claim data or null
 */
export function getClaim(chunkKey) {
    // Check cache first
    const cached = claimCache.get(chunkKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    // Load from storage
    const stored = WorldStore.get(`claim:${chunkKey}`)
    if (stored) {
        claimCache.set(chunkKey, {
            data: stored,
            timestamp: Date.now()
        })
        return stored
    }

    return null
}

/**
 * Set claim data with cache update
 * @param {string} chunkKey - Chunk key
 * @param {Object} claimData - Claim data
 */
export function setClaim(chunkKey, claimData) {
    // Update cache
    claimCache.set(chunkKey, {
        data: claimData,
        timestamp: Date.now()
    })

    // Update storage
    WorldStore.set(`claim:${chunkKey}`, claimData)
}

/**
 * Remove claim data
 * @param {string} chunkKey - Chunk key
 */
export function removeClaim(chunkKey) {
    // Remove from cache
    claimCache.delete(chunkKey)

    // Remove from storage
    WorldStore.delete(`claim:${chunkKey}`)
}

/**
 * Check if player is owner of claim
 * @param {string} chunkKey - Chunk key
 * @param {string} playerId - Player UUID
 * @returns {boolean} Whether player owns the claim
 */
export function isOwner(chunkKey, playerId) {
    const claim = getClaim(chunkKey)
    return claim?.ownerId === playerId
}

/**
 * Check if player has permission in claim
 * @param {string} chunkKey - Chunk key
 * @param {string} playerId - Player UUID
 * @param {number} permission - Permission bit
 * @returns {boolean} Whether player has permission
 */
export function hasPermission(chunkKey, playerId, permission) {
    const claim = getClaim(chunkKey)
    if (!claim) return false

    // Owner has all permissions
    if (claim.ownerId === playerId) return true

    // Check trusted players
    return (claim.trusted?.[playerId] & permission) === permission
}

/**
 * Add trusted player to claim
 * @param {string} chunkKey - Chunk key
 * @param {string} ownerId - Claim owner ID
 * @param {string} trustedId - Player to trust
 * @param {number} permissions - Permission bitmask
 */
export function addTrusted(chunkKey, ownerId, trustedId, permissions) {
    const claim = getClaim(chunkKey) || {
        ownerId,
        trusted: {},
        flags: 0
    }

    claim.trusted[trustedId] = permissions
    setClaim(chunkKey, claim)
}

/**
 * Remove trusted player from claim
 * @param {string} chunkKey - Chunk key
 * @param {string} trustedId - Player to untrust
 */
export function removeTrusted(chunkKey, trustedId) {
    const claim = getClaim(chunkKey)
    if (claim?.trusted) {
        delete claim.trusted[trustedId]
        setClaim(chunkKey, claim)
    }
}

/**
 * Get all claims for player
 * @param {string} playerId - Player UUID
 * @returns {Array} Array of claim data
 */
export function getPlayerClaims(playerId) {
    const claims = []
    
    // Iterate through all stored claims
    for (const [key, value] of claimCache.entries()) {
        if (value.data.ownerId === playerId) {
            claims.push({
                chunkKey: key,
                ...value.data
            })
        }
    }

    return claims
}

/**
 * Clean up expired cache entries
 */
export function cleanup() {
    const now = Date.now()
    for (const [key, value] of claimCache.entries()) {
        if (now - value.timestamp >= CACHE_TTL) {
            claimCache.delete(key)
        }
    }
}

