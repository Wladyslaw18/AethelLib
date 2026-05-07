/**
 * Block Command - Block players from sending TPA requests
 * Smith Forge Rule: Max 100 lines per file
 */

import { world } from "@minecraft/server"
import { TPAStore } from "../../systems/tpa/TpaStore.js"

export const BlockCommand = {
    name: "block",
    description: "Block a player from TPA requests",
    usage: "/ae:block <player_name>",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const targetName = args[0]
        
        if (!targetName) {
            player.sendMessage("§c§l» §7Usage: /ae:block <player_name>")
            return
        }


        // Find target player
        const target = [...world.getAllPlayers()].find(p => 
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found or offline.`)
            return
        }


        if (target.id === player.id) {
            player.sendMessage("§c§l» §7You cannot block yourself!")
            return
        }


        // Check if already blocked
        const blocked = TPAStore.getBlocked(player.id)
        if (blocked.includes(target.id)) {
            player.sendMessage(`§c§l» §7${target.name} is already blocked.`)
            return
        }


        // Block the player
        TPAStore.blockPlayer(player.id, target.id)
        player.sendMessage(`§a§l» §fBlocked §e${target.name}§f from sending you TPA requests.`)

    }
}

