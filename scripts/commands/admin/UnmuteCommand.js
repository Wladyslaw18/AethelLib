/**
 * Unmute Command - Unmute a player
 */

import { world } from "@minecraft/server"
import { MuteStore } from "../../systems/social/MuteStore.js"

export const UnmuteCommand = {
    name: "unmute",
    description: "Unmute a player",
    usage: "!unmute <playerName>",
    permission: "essentials.admin.mute",
    category: "admin",

    async execute(_data, player, args) {
        if (args.length < 1) {
            player.sendMessage("§cUsage: !unmute <playerName>")
            return
        }

        const playerName = args[0]
        const target = world.getAllPlayers().find(p => p.name === playerName)
        
        if (!target) {
            player.sendMessage(`§cPlayer '${playerName}' not found or not online`)
            return
        }

        try {
            const success = await MuteStore.unmute(target.id)
            if (success) {
                player.sendMessage(`§aSuccessfully unmuted ${target.name}`)
                target.sendMessage("§aYou have been unmuted by an admin.")
            } else {
                player.sendMessage("§cFailed to unmute player")
            }
        } catch (error) {
            player.sendMessage(`§cError unmuting player: ${error.message}`)
        }
    }
}

