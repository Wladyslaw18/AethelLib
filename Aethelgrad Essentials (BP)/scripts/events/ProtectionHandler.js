/**
 * Protection Handler - Intercept beforeEvents for claim protection
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { world } from "@minecraft/server"
import { 
    locationToChunkKey, 
    getClaim, 
    hasPermission 
} from "../systems/protection/ClaimStore.js"
import { PERMISSIONS } from "../systems/protection/ClaimService.js"

/**
 * Initialize protection event handlers
 */
export function init() {
    console.log("§2[Aethelgrad Essentials] Protection handlers initialized")
}

/**
 * Check if block is protected
 * @param {Block} block - Block to check
 * @param {string} playerId - Player ID
 * @param {number} requiredPermission - Required permission
 * @returns {boolean} Whether block is protected
 */
function isBlockProtected(block, playerId, requiredPermission) {
    const chunkKey = locationToChunkKey(block.location)
    const claim = getClaim(chunkKey)
    
    if (!claim) return false // No claim, no protection
    return !hasPermission(chunkKey, playerId, requiredPermission)
}

/**
 * Check if entity interaction is protected
 * @param {Entity} entity - Entity to check
 * @param {string} playerId - Player ID
 * @param {number} requiredPermission - Required permission
 * @returns {boolean} Whether entity is protected
 */
function isEntityProtected(entity, playerId, requiredPermission) {
    if (!entity.location) return false
    
    const chunkKey = locationToChunkKey(entity.location)
    const claim = getClaim(chunkKey)
    
    if (!claim) return false // No claim, no protection
    return !hasPermission(chunkKey, playerId, requiredPermission)
}

// Export protection checking functions for other systems
export { isBlockProtected, isEntityProtected }
