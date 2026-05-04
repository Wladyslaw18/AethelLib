/**
 * RTP Command - Random teleport to safe location
 */

import { Kernel } from "../../core/Kernel.js"

// Cooldown tracking
const cooldowns = new Map() // playerId → lastUsedTick

export const RTPCommand = {
    name: "rtp",
    description: "Random teleport to a safe location",
    usage: "!rtp [range]",
    permission: "essentials.rtp",
    category: "teleport",

    execute(data, player, args) {
        // Check cooldown
        const PermissionManager = Kernel.get("permissions")
        const cd = (PermissionManager.getPermission(player, "rtp.cooldown") ?? 10) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (Kernel.system.currentTick - last < cd) {
            player.sendMessage(`§cPlease wait before using this again.`)
            return
        }
        cooldowns.set(player.id, Kernel.system.currentTick)

        const range = args[0] ? parseInt(args[0]) : 1000

        if (isNaN(range) || range < 100 || range > 10000) {
            player.sendMessage("§cRange must be between 100 and 10000 blocks")
            return
        }

        // Check if player is in combat (placeholder)
        if (isInCombat(player)) {
            player.sendMessage("§cYou cannot use !rtp while in combat")
            return
        }

        player.sendMessage("§aFinding safe location...")

        // Start location search
        findSafeLocation(player, range)
    }
}

async function findSafeLocation(player, maxRange) {
    const overworld = Kernel.world.getDimension("minecraft:overworld")
    const spawnLocation = overworld.getSpawnLocation()

    let attempts = 0
    const maxAttempts = 50
    let unloadedChunkCount = 0

    while (attempts < maxAttempts) {
        attempts++

        // Generate random coordinates
        const angle = Math.random() * 2 * Math.PI
        const distance = Math.random() * maxRange

        const x = spawnLocation.x + Math.cos(angle) * distance
        const z = spawnLocation.z + Math.sin(angle) * distance

        // Find safe Y coordinate
        const safeY = await findSafeY(overworld, x, z)

        if (safeY !== null) {
            // Safe location found
            const location = { x: x + 0.5, y: safeY, z: z + 0.5 }

            Kernel.system.run(() => {
                try {
                    player.teleport(location, { dimension: overworld })
                    player.sendMessage(`§aTeleported to random location (${Math.floor(x)}, ${safeY}, ${Math.floor(z)})`)

                    // Save last location for !back
                    saveLastLocation(player.id, location)
                } catch (error) {
                    console.error(`RTP teleport error: ${error}`)
                    player.sendMessage("§cFailed to teleport")
                }
            })
            return
        } else {
            // Check if this was due to unloaded chunks
            const testBlock = overworld.getBlock({ x: Math.floor(x), y: 100, z: Math.floor(z) })
            if (!testBlock) {
                unloadedChunkCount++

                // If too many unloaded chunks, suggest smaller range
                if (unloadedChunkCount >= 10) {
                    player.sendMessage(`§eWarning: Many chunks are unloaded. Try a smaller range or wait for chunks to load.`)
                    unloadedChunkCount = 0
                }
            }
        }

        // Show progress
        if (attempts % 10 === 0) {
            player.sendMessage(`§7Searching... attempt ${attempts}/${maxAttempts}`)
        }
    }

    player.sendMessage(`§cCould not find safe location after ${maxAttempts} attempts. Try a smaller range.`)
}

async function findSafeY(dimension, x, z) {
    try {
        // Check from Y=320 down to Y=-64
        for (let y = 320; y >= -64; y--) {
            const blockLocation = { x: Math.floor(x), y: y, z: Math.floor(z) }

            try {
                const block = dimension.getBlock(blockLocation)
                if (!block) {
                    // Block is unloaded, skip this location
                    continue
                }

                const blockAbove = dimension.getBlock({ x: Math.floor(x), y: y + 1, z: Math.floor(z) })
                if (!blockAbove) {
                    // Block above is unloaded, skip this location
                    continue
                }

                // Check if this is a safe location (solid block with air above)
                const isSolid = isSafeBlock(block.typeId)
                const isAirAbove = blockAbove.typeId === "minecraft:air"

                if (isSolid && isAirAbove) {
                    // Check surrounding blocks for safety
                    if (await isAreaSafe(dimension, x, y + 1, z)) {
                        return y + 1 // Teleport to the air block
                    }
                }
            } catch (error) {
                // Block might be unloaded or inaccessible, continue to next Y level
                continue
            }
        }
    } catch (error) {
        console.error(`Error finding safe Y for coordinates (${Math.floor(x)}, ${Math.floor(z)}): ${error}`)
    }

    return null
}

async function isAreaSafe(dimension, x, y, z) {
    // Check 3x3 area around the player
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            try {
                const block = dimension.getBlock({ x: Math.floor(x + dx), y: y, z: Math.floor(z + dz) })
                if (!block) {
                    // Block is unloaded, consider this area unsafe
                    return false
                }

                // Avoid dangerous blocks
                if (isDangerousBlock(block.typeId)) {
                    return false
                }
            } catch (error) {
                // Block access failed, consider area unsafe
                return false
            }
        }
    }
    return true
}

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

function saveLastLocation(playerId, location) {
    const lastLocation = {
        x: Math.floor(location.x),
        y: Math.floor(location.y),
        z: Math.floor(location.z),
        dimension: "minecraft:overworld"
    }

    try {
        const player = [...Kernel.world.getAllPlayers()].find(p => p.id === playerId)
        if (player) {
            player.setDynamicProperty("ae:lastLocation", JSON.stringify(lastLocation))
        }
    } catch (error) {
        console.error(`Failed to save last location: ${error}`)
    }
}

function isInCombat(player) {
    // Placeholder for combat check
    // Will integrate with CombatSystem when built
    return false
}

