import { Kernel } from "../../core/Kernel.js"
import { Configuration } from "../../Configuration.js"

/*
 * INDUSTRIAL_SPATIAL_SECURITY_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * The primary execution engine for spatial-integrity protection. 
 * Orchestrates before-event interception for block-mutation and entity-interaction 
 * to enforce claim-contracts. 
 *
 * PHILOSOPHY: Private property is absolute. If you don't have the 
 * clearance bitmask, the reality-state mutation is cancelled.
 */

// AUTH_CLEARANCE_BITMASKS
const PERMISSIONS = {
    BUILD: 1,
    CONTAINERS: 2,
    DOORS: 4,
    REDSTONE: 8,
    MOB_INTERACT: 16,
    CRAFTING: 32
}

// BLOCK_CLASSIFICATION_MANIFESTS
const CONTAINER_BLOCKS = new Set(["chest", "barrel", "trapped_chest", "shulker", "hopper", "dropper", "dispenser", "furnace", "blast_furnace", "smoker", "brewing_stand"])
const DOOR_BLOCKS = new Set(["door", "gate", "trapdoor"])
const REDSTONE_BLOCKS = new Set(["lever", "button", "pressure_plate", "daylight_detector", "tripwire_hook", "repeater", "comparator"])
const CRAFTING_BLOCKS = new Set(["crafting_table", "smithing_table", "cartography_table", "loom", "stonecutter", "grindstone", "anvil", "enchanting_table"])

/* 
 * AUTHORITY_BYPASS_PROBE
 */
function isGodTag(player) {
    const tags = player.getTags()
    return Configuration.SUPER_ADMIN_TAGS.some(tag => tags.includes(tag))
}

/* 
 * BLOCK_CATEGORY_RESOLVER
 */
function classifyBlock(typeId) {
    for (const keyword of CONTAINER_BLOCKS) {
        if (typeId.includes(keyword)) return PERMISSIONS.CONTAINERS
    }
    for (const keyword of DOOR_BLOCKS) {
        if (typeId.includes(keyword)) return PERMISSIONS.DOORS
    }
    for (const keyword of REDSTONE_BLOCKS) {
        if (typeId.includes(keyword)) return PERMISSIONS.REDSTONE
    }
    for (const keyword of CRAFTING_BLOCKS) {
        if (typeId.includes(keyword)) return PERMISSIONS.CRAFTING
    }
    return 0 
}

/* 
 * SERVICE_INITIALIZATION_PROTOCOL
 * Subscribes to the world's before-events to perform real-time spatial 
 * clearance checks.
 */
export function init() {
    /* BLOCK_DECONSTRUCTION_INTERCEPTOR */
    Kernel.world.beforeEvents.playerBreakBlock.subscribe((event) => {
        const player = event.player
        if (isGodTag(player)) return

        const ClaimStore = Kernel.get("claimStore")
        const chunkKey = ClaimStore.locationToChunkKey(event.block.location)
        if (!ClaimStore.hasPermission(chunkKey, player.id, PERMISSIONS.BUILD)) {
            event.cancel = true
            player.onScreenDisplay.setActionBar("§c[Security] Access Denied: Spatial Integrity Violation");
        }
    })

    /* BLOCK_CONSTRUCTION_INTERCEPTOR */
    Kernel.world.beforeEvents.playerPlaceBlock.subscribe((event) => {
        const player = event.player
        if (isGodTag(player)) return

        const ClaimStore = Kernel.get("claimStore")
        const chunkKey = ClaimStore.locationToChunkKey(event.block.location)
        if (!ClaimStore.hasPermission(chunkKey, player.id, PERMISSIONS.BUILD)) {
            event.cancel = true
            player.onScreenDisplay.setActionBar("§c[Security] Access Denied: Spatial Integrity Violation");
        }
    })

    /* INTERACTION_VECTOR_INTERCEPTOR */
    Kernel.world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        const player = event.player
        if (isGodTag(player)) return

        const block = event.block
        const ClaimStore = Kernel.get("claimStore")
        const chunkKey = ClaimStore.locationToChunkKey(block.location)
        const requiredPermission = classifyBlock(block.typeId)

        if (requiredPermission === 0) return 

        if (!ClaimStore.hasPermission(chunkKey, player.id, requiredPermission)) {
            event.cancel = true
            player.onScreenDisplay.setActionBar("§c[Security] Access Denied: Clearance Bitmask Missing");
        }
    })

    /* ENTITY_INTERACTION_INTERCEPTOR */
    Kernel.world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
        const player = event.player
        if (isGodTag(player)) return

        const entity = event.target
        if (!entity?.location) return

        const ClaimStore = Kernel.get("claimStore")
        const chunkKey = ClaimStore.locationToChunkKey(entity.location)
        if (!ClaimStore.hasPermission(chunkKey, player.id, PERMISSIONS.MOB_INTERACT)) {
            event.cancel = true
            player.onScreenDisplay.setActionBar("§c[Security] Access Denied: Entity Integrity Violation");
        }
    })

    console.log("[Aethelgrad Essentials] Spatial Security Engine operational.");
}

/* 
 * SPATIAL_ACQUISITION_PROTOCOL
 * Performs a collision-scan across the target radius before committing 
 * the claim to the registry.
 */
export function createClaim(player, location, radius = 1) {
    const ClaimStore = Kernel.get("claimStore")
    const centerChunk = ClaimStore.locationToChunkKey(location)
    const playerId = player.id

    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            const chunkKey = centerChunk.split(',').map((coord, i) => 
                parseInt(coord) + (i === 0 ? x : z)
            ).join(',')
            
            if (ClaimStore.getClaim(chunkKey)) {
                player.sendMessage("[Error] Spatial Collision: Chunk already registered.");
                return false
            }
        }
    }

    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            const chunkKey = centerChunk.split(',').map((coord, i) => 
                parseInt(coord) + (i === 0 ? x : z)
            ).join(',')
            
            ClaimStore.setClaim(chunkKey, {
                ownerId: playerId,
                trusted: {},
                flags: 0
            })
        }
    }

    player.sendMessage(`[Success] Spatial buffer acquired (Radius: ${radius} chunks).`);
    return true
}

/* 
 * SPATIAL_DECOMMISSION_PROTOCOL
 */
export function removeClaim(player, location) {
    const ClaimStore = Kernel.get("claimStore")
    const chunkKey = ClaimStore.locationToChunkKey(location)
    const playerId = player.id

    if (!ClaimStore.isOwner(chunkKey, playerId)) {
        player.sendMessage("[Error] Security Violation: Target spatial buffer is not under your authority.");
        return false
    }

    ClaimStore.removeClaim(chunkKey)
    player.sendMessage("[Success] Spatial buffer decommissioned.");
    return true
}

/* 
 * TRUST_PROFILE_ORCHESTRATOR
 */
export function trustPlayer(player, targetName, permissions = PERMISSIONS.BUILD) {
    const target = Kernel.world.getPlayers().find(p => p.name === targetName)
    if (!target) {
        player.sendMessage(`[Error] Entity '${targetName}' not found.`);
        return
    }

    const ClaimStore = Kernel.get("claimStore")
    const playerClaims = ClaimStore.getPlayerClaims(player.id)
    if (playerClaims.length === 0) {
        player.sendMessage("[Error] No active spatial manifests found.");
        return
    }

    for (const claim of playerClaims) {
        ClaimStore.addTrusted(claim.chunkKey, player.id, target.id, permissions)
    }

    player.sendMessage(`[Success] Entity '${targetName}' clearance bitmask injected: ${permissions}`);
}

/* 
 * TRUST_PROFILE_DECOMMISSIONER
 */
export function untrustPlayer(player, targetName) {
    const target = Kernel.world.getPlayers().find(p => p.name === targetName)
    if (!target) {
        player.sendMessage(`[Error] Entity '${targetName}' not found.`);
        return
    }

    const ClaimStore = Kernel.get("claimStore")
    const playerClaims = ClaimStore.getPlayerClaims(player.id)
    for (const claim of playerClaims) {
        ClaimStore.removeTrusted(claim.chunkKey, target.id)
    }

    player.sendMessage(`[Success] Entity '${targetName}' clearance bitmask purged.`);
}

export { PERMISSIONS }
