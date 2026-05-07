import { Kernel } from "../../core/Kernel.js"

/*
 * Random Teleport Command
 * ----------------------------------------------------------------------------
 * Teleports a player to a random safe location within a defined range.
 */


const cooldowns = new Map() // PLAYER_COOLDOWN_BUFFER

export const RTPCommand = {
    name: "rtp",
    description: "Teleport to a random safe location",

    usage: "/ae:rtp [range]",

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
            player.sendMessage(`§c§l» §7Teleport on cooldown. Wait §e${Math.ceil((cd - (Kernel.system.currentTick - last)) / 20)}s§7.`);
            return
        }

        cooldowns.set(player.id, Kernel.system.currentTick)

        const range = args[0] ? parseInt(args[0]) : 1000

        if (isNaN(range) || range < 100 || range > 10000) {
            player.sendMessage("§c§l» §7Range must be between 100 and 10000.");
            return
        }


        /* COMBAT_STATE_PROBE */
        if (isInCombat(player)) {
            player.sendMessage("§c§l» §7Teleport disabled while in combat.");
            return
        }


        player.sendMessage("§6§l» §eFinding a safe spot...");

        findSafeLocation(player, range)
    }
}

/*
 * Safe Location Search
 * ----------------------------------------------------------------------------
 * Searches for a safe location to teleport the player.
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
                    player.sendMessage(`§a§l» §fTeleported to §e(${Math.floor(x)}, ${safeY}, ${Math.floor(z)})§f!`);
                } else {
                    player.sendMessage("§c§l» §7Teleport failed.");
                }

            })
            return
        } else {
            const testBlock = overworld.getBlock({ x: Math.floor(x), y: 100, z: Math.floor(z) })
            if (!testBlock) {
                unloadedChunkCount++
                if (unloadedChunkCount >= 10) {
                    player.sendMessage(`§e§l» §7Area is too far, try a smaller range.`);
                    unloadedChunkCount = 0
                }

            }
        }

        if (attempts % 10 === 0) {
            player.sendMessage(`§6§l» §7Searching... (Attempt ${attempts}/${maxAttempts})`);
        }

    }

    player.sendMessage(`§c§l» §7Could not find a safe spot after ${maxAttempts} attempts.`);

}

/* 
 * Height Search
 * Scans from the top of the world down to find a solid block.
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
 * Area Safety Check
 * Ensures the player won't suffocate or fall into lava.
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
 * Safe Blocks List
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
 * Dangerous Blocks List
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
