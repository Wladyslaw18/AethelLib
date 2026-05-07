/**
 * Unmute Command - Unmute a player
 */

import { MuteStore } from "../../systems/social/MuteStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

export const UnmuteCommand = {
    name: "unmute",
    description: "Unmute a player's chat",

    usage: "/ae:unmute <playerName>",
    permission: "essentials.admin.mute",
    category: "admin",
    parameters: [
        { name: "player", type: "player", optional: false }
    ],

    async execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:unmute <playerName>")
            player.sendMessage("§e§l» §fTip: §7Type a player name to unmute them.")
            return
        }

        const playerName = args.join(" ")
        const target = PlayerUtils.findPlayer(playerName)
        
        if (!target) {
            player.sendMessage(`§c§l» §7Player '${playerName}' not found or not online.`)
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


