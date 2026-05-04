/**
 * Claim Service - Modular permission-deep chunk protection
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { world, system } from "@minecraft/server"
import { 
    locationToChunkKey, 
    getClaim, 
    setClaim, 
    isOwner, 
    hasPermission,
    addTrusted,
    removeTrusted,
    removeClaim as deleteClaim,
    getPlayerClaims
} from "./ClaimStore.js"

// Permission bit definitions
const PERMISSIONS = {
    BUILD: 1,
    CHESTS: 2,
    DOORS: 4,
    INTERACT: 8,
    CONTAINERS: 16
}

/**
 * Initialize claim protection system
 */
export function init() {
    // Intercept block breaking
    world.beforeEvents.playerBreakBlock.subscribe((event) => {
        const player = event.player
        const block = event.block
        const chunkKey = locationToChunkKey(block.location)

        if (!hasPermission(chunkKey, player.id, PERMISSIONS.BUILD)) {
            event.cancel = true
            player.sendMessage("§cYou don't have permission to break blocks here!")
            return
        }
    })

    // Intercept block placing
    world.beforeEvents.playerPlaceBlock.subscribe((event) => {
        const player = event.player
        const block = event.block
        const chunkKey = locationToChunkKey(block.location)

        if (!hasPermission(chunkKey, player.id, PERMISSIONS.BUILD)) {
            event.cancel = true
            player.sendMessage("§cYou don't have permission to place blocks here!")
            return
        }
    })

    // Intercept block interaction
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        const player = event.player
        const block = event.block
        const chunkKey = locationToChunkKey(block.location)

        // Check specific block permissions
        let requiredPermission = PERMISSIONS.INTERACT

        if (block.typeId.includes('chest') || block.typeId.includes('shulker')) {
            requiredPermission = PERMISSIONS.CHESTS
        } else if (block.typeId.includes('door') || block.typeId.includes('gate')) {
            requiredPermission = PERMISSIONS.DOORS
        } else if (block.typeId.includes('container') || block.typeId.includes('barrel')) {
            requiredPermission = PERMISSIONS.CONTAINERS
        }

        if (!hasPermission(chunkKey, player.id, requiredPermission)) {
            event.cancel = true
            player.sendMessage("§cYou don't have permission to interact with this!")
            return
        }
    })

    console.log("§2[Aethelgrad Essentials] Claim protection initialized")
}

/**
 * Create a new claim
 * @param {Player} player - Player creating claim
 * @param {Vector3} location - Claim center location
 * @param {number} radius - Claim radius in chunks
 * @returns {boolean} Success status
 */
export function createClaim(player, location, radius = 1) {
    const centerChunk = locationToChunkKey(location)
    const playerId = player.id

    // Check if chunks are already claimed
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            const chunkKey = centerChunk.split(',').map((coord, i) => 
                parseInt(coord) + (i === 0 ? x : z)
            ).join(',')
            
            if (getClaim(chunkKey)) {
                player.sendMessage("§cThis chunk is already claimed!")
                return false
            }
        }
    }

    // Create claims
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            const chunkKey = centerChunk.split(',').map((coord, i) => 
                parseInt(coord) + (i === 0 ? x : z)
            ).join(',')
            
            setClaim(chunkKey, {
                ownerId: playerId,
                trusted: {},
                flags: 0
            })
        }
    }

    player.sendMessage(`§aClaim created with radius ${radius} chunks!`)
    return true
}

/**
 * Remove a claim
 * @param {Player} player - Player removing claim
 * @param {Vector3} location - Claim location
 * @returns {boolean} Success status
 */
export function removeClaim(player, location) {
    const chunkKey = locationToChunkKey(location)
    const playerId = player.id

    if (!isOwner(chunkKey, playerId)) {
        player.sendMessage("§cYou don't own this claim!")
        return false
    }

    // Remove claim
    deleteClaim(chunkKey)
    player.sendMessage("§aClaim removed!")
    return true
}

/**
 * Add trusted player to claim
 * @param {Player} player - Claim owner
 * @param {string} targetName - Player to trust
 * @param {number} permissions - Permission bitmask
 */
export function trustPlayer(player, targetName, permissions = PERMISSIONS.BUILD) {
    const target = world.getPlayers().find(p => p.name === targetName)
    if (!target) {
        player.sendMessage(`§cPlayer ${targetName} not found!`)
        return
    }

    // Find any chunk owned /* SINGULARITY */
    const playerClaims = getPlayerClaims(player.id)
    if (playerClaims.length === 0) {
        player.sendMessage("§cYou don't have any claims!")
        return
    }

    // Add trust to all player's claims
    for (const claim of playerClaims) {
        addTrusted(claim.chunkKey, player.id, target.id, permissions)
    }

    player.sendMessage(`§aAdded ${targetName} to your claims with permissions ${permissions}!`)
}

/**
 * Remove trusted player from claim
 * @param {Player} player - Claim owner
 * @param {string} targetName - Player to untrust
 */
export function untrustPlayer(player, targetName) {
    const target = world.getPlayers().find(p => p.name === targetName)
    if (!target) {
        player.sendMessage(`§cPlayer ${targetName} not found!`)
        return
    }

    // Remove trust from all player's claims
    const playerClaims = getPlayerClaims(player.id)
    for (const claim of playerClaims) {
        removeTrusted(claim.chunkKey, target.id)
    }

    player.sendMessage(`§aRemoved ${targetName} from your claims!`)
}

// Export permission constants
export { PERMISSIONS }

