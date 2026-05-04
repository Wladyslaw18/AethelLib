/**
 * Warp Command - Teleport to a server-wide warp
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system, world } from "@minecraft/server"

// Cooldown tracking
const cooldowns = new Map() // playerId → lastUsedTick

export const WarpCommand = {
    name: "warp",
    description: "Teleport to a server-wide warp",
    usage: "!warp <name>",
    permission: "essentials.warp",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]

        if (!name) {
            player.sendMessage("§cUsage: !warp <name>")
            return
        }

        // Check cooldown
        const cd = (RankSystem.getPermission(player, "warp.cooldown") ?? 3) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (system.currentTick - last < cd) {
            const remaining = Math.ceil((cd - (system.currentTick - last)) / 20)
            player.sendMessage(`§cPlease wait §e${remaining}s§c before using this again.`)
            return
        }
        cooldowns.set(player.id, system.currentTick)

        const warp = await WarpStore.getWarp(name)

        if (!warp) {
            player.sendMessage(`§cWarp '§e${name}§c' not found`)
            return
        }

        // Wrap teleport in system.run() to prevent "Busy Context" crash
        system.run(() => {
            try {
                const targetDimension = world.getDimension(warp.dimension)

                // Check if dimension exists
                if (!targetDimension) {
                    player.sendMessage(`§cDimension '${warp.dimension}' not found`)
                    return
                }

                player.teleport(
                    { x: warp.x + 0.5, y: warp.y, z: warp.z + 0.5 },
                    { dimension: targetDimension }
                )

                player.sendMessage(`§aTeleported to warp '§e${name}§a'`)
            } catch (error) {
                console.error(`Warp teleport error: ${error}`)
                player.sendMessage("§cFailed to teleport to warp")
            }
        })
    }
}

