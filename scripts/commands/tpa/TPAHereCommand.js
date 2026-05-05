/**
 * TPAHere Command - Request another player to teleport to you
 */

import { Kernel } from "../../core/Kernel.js"

export const TPAHereCommand = {
    name: "tpahere",
    description: "Request another player to teleport to you",
    usage: "!tpahere <player_name>",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(_data, player, args) {
        const targetName = args[0]
        
        if (!targetName) {
            player.sendMessage("§cUsage: !tpahere <player_name>")
            return
        }

        // Find target player via Kernel
        const targetPlayer = [...Kernel.world.getAllPlayers()].find(p => 
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

        // Send TPAHere request via Service
        const TpaService = Kernel.get("tpaService")
        const success = TpaService.sendRequest(player, targetPlayer, "tpahere")

        if (success) {
            player.sendMessage(`§aTPAHere request sent to §e${targetPlayer.name}§a!`)
        }
    }
}

