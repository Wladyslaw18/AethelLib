/**
 * Unblock Command - Unblock players from TPA requests
 * Smith Forge Rule: Max 100 lines per file
 */

import { world } from "@minecraft/server"
import { TPAStore } from "../../systems/tpa/TpaStore.js"

export const UnblockCommand = {
    name: "unblock",
    description: "Unblock a player from TPA requests",
    usage: "!unblock <player_name>",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const targetName = args[0]
        
        if (!targetName) {
            player.sendMessage("§cUsage: !unblock <player_name>")
            return
        }

        // Find target player
        const target = [...world.getPlayers()].find(p => 
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found or not online`)
            return
        }

        // Check if already unblocked
        const blocked = TPAStore.getBlocked(player.id)
        if (!blocked.includes(target.id)) {
            player.sendMessage(`§c${target.name} is not blocked!`)
            return
        }

        // Unblock the player
        TPAStore.unblockPlayer(player.id, target.id)
        player.sendMessage(`§aUnblocked §e${target.name}§a from sending you TPA requests!`)
    }
}

