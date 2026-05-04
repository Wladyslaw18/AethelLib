/**
 * Pay Command - Send money to another player
 */

import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { world } from "@minecraft/server"

export const PayCommand = {
    name: "pay",
    description: "Send money to another player",
    usage: "!pay <player_name> <amount>",
    permission: "essentials.pay",
    category: "economy",

    async execute(data, player, args) {
        const targetName = args[0]
        const amountStr = args[1]

        if (!targetName || !amountStr) {
            player.sendMessage("§cUsage: !pay <player_name> <amount>")
            return
        }

        // Parse amount
        const amount = parseFloat(amountStr)
        
        if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount)) {
            player.sendMessage("§cAmount must be a positive number")
            return
        }

        if (amount < 1) {
            player.sendMessage("§cMinimum payment amount is $1")
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

        if (targetPlayer.id === player.id) {
            player.sendMessage("§cYou cannot pay yourself")
            return
        }

        // Check if sender has enough money
        const hasEnough = await EconomyStore.hasEnough(player, amount)
        if (!hasEnough) {
            const balance = await EconomyStore.getBalance(player)
            player.sendMessage(`§cInsufficient funds. You have §a$${balance.toLocaleString()}§c, need §a$${amount.toLocaleString()}`)
            return
        }

        // Process payment
        const success = await EconomyStore.transferMoney(player, targetPlayer, amount)

        if (success) {
            player.sendMessage(`§aYou sent §e$${amount.toLocaleString()}§a to §6${targetPlayer.name}`)
            targetPlayer.sendMessage(`§aYou received §e$${amount.toLocaleString()}§a from §6${player.name}`)
        } else {
            player.sendMessage("§cPayment failed. Please try again.")
        }
    }
}

