/**
 * GoHome Command - Teleport to a home
 */

import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system, world } from "@minecraft/server"

// Cooldown tracking
const cooldowns = new Map() // playerId → lastUsedTick

export const GoHomeCommand = {
    name: "home",
    description: "Teleport to one of your homes",
    usage: "!home <name>",
    permission: "essentials.home",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]

        if (!name) {
            player.sendMessage("§cUsage: !home <name>")
            return
        }

        // Check cooldown
        const cd = (RankSystem.getPermission(player, "home.cooldown") ?? 2) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (system.currentTick - last < cd) {
            const remaining = Math.ceil((cd - (system.currentTick - last)) / 20)
            player.sendMessage(`§cPlease wait §e${remaining}s§c before using this again.`)
            return
        }
        cooldowns.set(player.id, system.currentTick)

        const home = await HomeStore.getHome(player, name)

        if (!home) {
            player.sendMessage(`§cHome '§e${name}§c' not found`)
            return
        }

        // Wrap teleport in system.run() to prevent "Busy Context" crash
        system.run(() => {
            try {
                const targetDimension = world.getDimension(home.dimension)

                // Check if dimension exists
                if (!targetDimension) {
                    player.sendMessage(`§cDimension '${home.dimension}' not found`)
                    return
                }

                player.teleport(
                    { x: home.x + 0.5, y: home.y, z: home.z + 0.5 },
                    { dimension: targetDimension }
                )

                player.sendMessage(`§aTeleported to home '§e${name}§a'`)
            } catch (error) {
                console.error(`Home teleport error: ${error}`)
                player.sendMessage("§cFailed to teleport to home")
            }
        })
    }
}

