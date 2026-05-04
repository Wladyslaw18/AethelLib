/**
 * Money Command - Check player balance
 */

import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { world } from "@minecraft/server"

export const MoneyCommand = {
    name: "money",
    description: "Check your or another player's balance",
    usage: "!money [player_name]",
    permission: "essentials.money",
    category: "economy",

    async execute(data, player, args) {
        const targetName = args[0]
        
        // If no target specified, show own balance
        if (!targetName) {
            const balance = await EconomyStore.getBalance(player)
            player.sendMessage(`§6Your balance: §a$${balance.toLocaleString()}`)
            return
        }

        // Try to find target player
        const targetPlayer = [...world.getPlayers()].find(p => 
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!targetPlayer) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found or not online`)
            return
        }

        const balance = await EconomyStore.getBalance(targetPlayer)
        player.sendMessage(`§6${targetPlayer.name}'s balance: §a$${balance.toLocaleString()}`)
    }
}

