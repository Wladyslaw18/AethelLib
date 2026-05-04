/**
 * TPAHere Command - Request another player to teleport to you
 */

import { TPAStore } from "../../systems/tpa/TpaStore.js"
import { world } from "@minecraft/server"

export const TPAHereCommand = {
    name: "tpahere",
    description: "Request another player to teleport to you",
    usage: "!tpahere <player_name>",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const targetName = args[0]
        
        if (!targetName) {
            player.sendMessage("§cUsage: !tpahere <player_name>")
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
            player.sendMessage("§cYou cannot send a TPAHere request to yourself")
            return
        }

        // Check if target has TPA disabled
        const targetSettings = await TPAStore.getSettings(targetPlayer.id)
        if (!targetSettings.enabled) {
            player.sendMessage(`§e${targetPlayer.name}§c has TPA requests disabled`)
            return
        }

        // Create TPAHere request
        const requestId = await TPAStore.createRequest(
            player.id,
            player.name,
            targetPlayer.id,
            targetPlayer.name,
            player.location,
            player.dimension.id,
            "tpahere"
        )

        // Notify both players
        player.sendMessage(`§aTPAHere request sent to §e${targetPlayer.name}§a. They have 5 minutes to accept.`)
        
        if (targetSettings.notifyOnRequest) {
            targetPlayer.sendMessage(`§e${player.name}§a has requested you teleport to them. Use §6!tpaccept§a to accept or §6!tpacancel§a to cancel.`)
        }
    }
}
