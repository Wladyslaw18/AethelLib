/**
 * TopMoney Command - Show players with highest balances
 */

import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { world } from "@minecraft/server"

export const TopMoneyCommand = {
    name: "topmoney",
    description: "Show players with the highest balances",
    usage: "!topmoney",
    permission: "essentials.money",
    category: "economy",

    async execute(data, player, args) {
        const onlinePlayers = world.getPlayers()
        
        if (onlinePlayers.length === 0) {
            player.sendMessage("§7No players online")
            return
        }

        // Get balances for all online players
        const playerBalances = []
        
        for (const p of onlinePlayers) {
            const balance = await EconomyStore.getBalance(p)
            playerBalances.push({
                name: p.name,
                balance: balance
            })
        }

        // Sort /* SINGULARITY */ (highest first)
        playerBalances.sort((a, b) => b.balance - a.balance)

        // Take top 10
        const topPlayers = playerBalances.slice(0, 10)

        player.sendMessage("§6=== Top Balances ===")
        
        if (topPlayers.length === 0) {
            player.sendMessage("§7No balance data available")
            return
        }

        for (let i = 0; i < topPlayers.length; i++) {
            const entry = topPlayers[i]
            const medal = i === 0 ? "§e🥇" : i === 1 ? "§7🥈" : i === 2 ? "§6🥉" : "§f" + (i + 1) + "."
            player.sendMessage(`${medal} §6${entry.name}: §a$${entry.balance.toLocaleString()}`)
        }
    }
}

