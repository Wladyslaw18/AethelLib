import { Kernel } from "../../core/Kernel.js"

/*
 * SPATIAL_RANDOMIZATION_VECTOR
 * ----------------------------------------------------------------------------
 * A high-performance utility for randomizing an entity's coordinates within 
 * a defined range. Implements a multi-stage search algorithm to identify 
 * non-volatile Y-levels and safe surface blocks.
 *
 * PHILOSOPHY: Exploration is mandatory. If you get stuck in a wall, it's 
 * an architectural failure—hence the 'findSafeLocation' protocol.
 */

const cooldowns = new Map() // PLAYER_COOLDOWN_BUFFER

export const RTPCommand = {
    name: "rtp",
    description: "Executes a random teleportation sequence to a safe coordinate buffer.",
    usage: "!rtp [range_identifier]",
    permission: "essentials.rtp",
    category: "Teleport",

    /* 
     * VECTOR_EXECUTION_ENTRY
     */
    execute(_data, player, args) {
        /* COOLDOWN_RESOLUTION */
        const PermissionManager = Kernel.get("permissions")
        const cd = (PermissionManager.getPermission(player, "rtp.cooldown") ?? 10) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (Kernel.system.currentTick - last < cd) {
            player.sendMessage(`[Cooldown] Vector recharging. Wait ${Math.ceil((cd - (Kernel.system.currentTick - last)) / 20)}s.`);
            return
        }
        cooldowns.set(player.id, Kernel.system.currentTick)

        const range = args[0] ? parseInt(args[0]) : 1000

        if (isNaN(range) || range < 100 || range > 10000) {
            player.sendMessage("[Error] Spatial constraint violation: Range must be 100-10000.");
            return
        }

        /* COMBAT_STATE_PROBE */
        if (isInCombat(player)) {
            player.sendMessage("[Security] Randomization vector disabled during active engagement.");
            return
        }

        player.sendMessage("[System] Initiating spatial search protocol...");
        findSafeLocation(player, range)
    }
}

/*
 * SAFE_LOCATION_SEARCH_ALGORITHM
 * ----------------------------------------------------------------------------
 * Performs up to 50 iterations to identify a valid surface block. 
 * Utilizes a polar-coordinate randomization strategy to ensure uniform 
 * distribution across the circular search area.
 */
async function findSafeLocation(player, maxRange) {
    const overworld = Kernel.world.getDimension("minecraft:overworld")
    const spawnLocation = Kernel.world.getDefaultSpawnLocation?.() || { x: 0, y: 0, z: 0 }

    let attempts = 0
    const maxAttempts = 50
    let unloadedChunkCount = 0

    while (attempts < maxAttempts) {
        attempts++

        const angle = Math.random() * 2 * Math.PI
        const distance = Math.random() * maxRange

        const x = spawnLocation.x + Math.cos(angle) * distance
        const z = spawnLocation.z + Math.sin(angle) * distance

        /* 
         * VERTICAL_BUFFER_SCAN
         */
        const safeY = await findSafeY(overworld, x, z)

        if (safeY !== null) {
            const location = { x: x + 0.5, y: safeY, z: z + 0.5 }

            Kernel.system.run(() => {
                const TeleportService = Kernel.get("teleportService")
                if (TeleportService.teleport(player, location, "minecraft:overworld")) {
                    player.sendMessage(`[Success] Spatial migration complete: (${Math.floor(x)}, ${safeY}, ${Math.floor(z)})`);
                } else {
                    player.sendMessage("[Fatal] Teleportation handshake failure.");
                }
            })
            return
        } else {
            const testBlock = overworld.getBlock({ x: Math.floor(x), y: 100, z: Math.floor(z) })
            if (!testBlock) {
                unloadedChunkCount++
                if (unloadedChunkCount >= 10) {
                    player.sendMessage(`[Warning] Chunk-buffer saturation detected. Try a smaller range.`);
                    unloadedChunkCount = 0
                }
            }
        }

        if (attempts % 10 === 0) {
            player.sendMessage(`[System] Scanning... iteration ${attempts}/${maxAttempts}`);
        }
    }

    player.sendMessage(`[Error] Search timeout. No safe surface identified in ${maxAttempts} iterations.`);
}

/* 
 * VERTICAL_SCAN_PROTOCOL
 * Scans from the sky-buffer down to the bedrock layer to find a 
 * non-volatile solid block with air clearance.
 */
async function findSafeY(dimension, x, z) {
    try {
        for (let y = 320; y >= -64; y--) {
            const blockLocation = { x: Math.floor(x), y: y, z: Math.floor(z) }

            try {
                const block = dimension.getBlock(blockLocation)
                if (!block) continue

                const blockAbove = dimension.getBlock({ x: Math.floor(x), y: y + 1, z: Math.floor(z) })
                if (!blockAbove) continue

                const isSolid = isSafeBlock(block.typeId)
                const isAirAbove = blockAbove.typeId === "minecraft:air"

                if (isSolid && isAirAbove) {
                    if (await isAreaSafe(dimension, x, y + 1, z)) {
                        return y + 1 
                    }
                }
            } catch (error) {
                continue
            }
        }
    } catch (error) {
        console.error(`[RTPCommand] Y_SCAN_FAILURE for (${Math.floor(x)}, ${Math.floor(z)}): ${error}`)
    }

    return null
}

/* 
 * SPATIAL_AREA_SAFETY_VALIDATOR
 * Checks a 3x3 footprint to ensure the entity won't suffocate or 
 * ignite upon arrival.
 */
async function isAreaSafe(dimension, x, y, z) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            try {
                const block = dimension.getBlock({ x: Math.floor(x + dx), y: y, z: Math.floor(z + dz) })
                if (!block || isDangerousBlock(block.typeId)) {
                    return false
                }
            } catch (error) {
                return false
            }
        }
    }
    return true
}

/* 
 * NON_VOLATILE_SURFACE_MANIFEST
 */
function isSafeBlock(blockId) {
    const safeBlocks = [
        "minecraft:grass_block",
        "minecraft:dirt",
        "minecraft:sand",
        "minecraft:gravel",
        "minecraft:stone",
        "minecraft:cobblestone",
        "minecraft:snow_block",
        "minecraft:podzol",
        "minecraft:mycelium"
    ]
    return safeBlocks.includes(blockId)
}

/* 
 * VOLATILE_BLOCK_MANIFEST
 */
function isDangerousBlock(blockId) {
    const dangerousBlocks = [
        "minecraft:lava",
        "minecraft:magma_block",
        "minecraft:fire",
        "minecraft:soul_fire",
        "minecraft:cactus",
        "minecraft:water",
        "minecraft:flowing_water"
    ]
    return dangerousBlocks.includes(blockId)
}

function isInCombat(_player) {
    // TODO: Integrate with CombatIntegrity engine.
    return false
}
