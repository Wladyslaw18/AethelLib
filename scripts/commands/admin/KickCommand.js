/**
 * Kick Command - Kick players from server
 */

import { system, world } from "@minecraft/server"

export const KickCommand = {
    name: "kick",
    description: "Kick a player from the server",
    usage: "!kick <player> [reason]",
    permission: "essentials.kick",
    category: "admin",

    execute(data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§cUsage: !kick <player> [reason]")
            return
        }

        const targetName = args[0]
        const reason = args.slice(1).join(" ") || "No reason provided"

        const target = world.getPlayers().find(p =>
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found`)
            return
        }

        // Check permissions (can't kick admins unless you're higher level)
        if (target.hasTag("admin") && !player.hasTag("owner")) {
            player.sendMessage("§cYou cannot kick other admins")
            return
        }

        // Perform kick using proper command
        system.run(() => {
            try {
                // Use the kick command instead of invalid player.remove()
                target.runCommand(`kick "${target.name}" ${reason}`)

                // Announce kick
                const kickMessage = `§6§l[§eKICK§6§l] §r${target.name} §7was kicked by §e${player.name}§7\n§7Reason: §f${reason}`

                world.getPlayers().forEach(p => {
                    if (p.hasTag("admin") || p === player) {
                        p.sendMessage(kickMessage)
                    }
                })

                player.sendMessage(`§aSuccessfully kicked §e${target.name}`)
            } catch (error) {
                console.error(`Failed to kick ${targetName}: ${error}`)
                player.sendMessage(`§cFailed to kick §e${targetName}`)
            }
        })
    }
}

