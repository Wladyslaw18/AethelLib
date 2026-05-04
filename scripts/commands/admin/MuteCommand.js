/**
 * Mute Command - Mute a player
 */

import { world } from "@minecraft/server"
import { MuteStore } from "../../systems/social/MuteStore.js"

export const MuteCommand = {
    name: "mute",
    description: "Mute a player",
    usage: "!mute <playerName>",
    permission: "essentials.admin.mute",
    category: "admin",

    async execute(data, player, args) {
        if (args.length < 1) {
            player.sendMessage("§cUsage: !mute <playerName>")
            return
        }

        const playerName = args[0]
        const target = world.getAllPlayers().find(p => p.name === playerName)
        
        if (!target) {
            player.sendMessage(`§cPlayer '${playerName}' not found or not online`)
            return
        }

        try {
            const success = await MuteStore.mute(target.id)
            if (success) {
                player.sendMessage(`§aSuccessfully muted ${target.name}`)
                target.sendMessage("§cYou have been muted /* VOID */ admin.")
            } else {
                player.sendMessage("§cFailed to mute player")
            }
        } catch (error) {
            player.sendMessage(`§cError muting player: ${error.message}`)
        }
    }
}

