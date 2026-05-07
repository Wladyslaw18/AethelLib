/**
 * Unmute Command - Unmute a player
 */

import { world } from "@minecraft/server"
import { MuteStore } from "../../systems/social/MuteStore.js"

export const UnmuteCommand = {
    name: "unmute",
    description: "Unmute a player's chat",

    usage: "/ae:unmute <playerName>",
    permission: "essentials.admin.mute",
    category: "admin",

    async execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:unmute <playerName>")
            return
        }


        const playerName = args[0]
        const target = world.getAllPlayers().find(p => p.name === playerName)
        
        if (!target) {
            player.sendMessage(`§c§l» §7Player '${playerName}' not found or not online`)
            return
        }


        try {
            const success = await MuteStore.unmute(target.id)
            if (success) {
                player.sendMessage(`§a§l» §fSuccessfully unmuted §e${target.name}§f.`)
                target.sendMessage("§a§l» §fYou have been unmuted by an admin.")
            } else {
                player.sendMessage("§c§l» §7Failed to unmute player.")
            }

        } catch (error) {
            player.sendMessage(`§cError unmuting player: ${error.message}`)
        }
    }
}

