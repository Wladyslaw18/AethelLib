/**
 * TPA Command - Request to teleport to another player
 * Smith Forge Rule: Max 100 lines per file
 */

import { world, system } from "@minecraft/server"
import { sendRequest } from "../../systems/tpa/TpaService.js"
import { getPendingRequests } from "../../systems/tpa/TpaHandshake.js"

export const TPACommand = {
    name: "tpa",
    description: "Request to teleport to another player",
    usage: "!tpa <player_name>",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const targetName = args[0]

        if (!targetName) {
            player.sendMessage("§cUsage: !tpa <player_name>")
            return
        }

        // Find target player
        const targetPlayer = [...world.getPlayers()].find(p =>
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!targetPlayer) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found or not online`)
            return
        }

        if (targetPlayer.id === player.id) {
            player.sendMessage("§cYou cannot send a TPA request to yourself")
            return
        }

        // Send TPA request
        const success = sendRequest(player, targetPlayer, "tpa")

        if (success) {
            player.sendMessage(`§aTPA request sent to §e${targetPlayer.name}§a! They have 5 minutes to accept.`)
        }
    }
}

