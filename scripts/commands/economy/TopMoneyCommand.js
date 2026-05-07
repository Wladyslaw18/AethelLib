import { EconomyStore } from "../../systems/economy/EconomyStore.js"


/*
 * Top Money Command
 * ----------------------------------------------------------------------------
 * Displays the richest players on the server.
 */

export const TopMoneyCommand = {
    name: "topmoney",
    description: "View the richest players on the server",

    usage: "/ae:topmoney",
    permission: "essentials.money",
    category: "ECONOMY",

    /* 
     * HIERARCHY_QUERY_EXECUTION
     */
    async execute(_data, player, _args) {
        const balances = EconomyStore.getAllBalances()
        
        if (balances.length === 0) {
            player.sendMessage("§c§l» §7No balances found.");
            return
        }


        // Sort by balance descending
        balances.sort((a, b) => b.balance - a.balance)
        const topPlayers = balances.slice(0, 10)

        player.sendMessage(" ")
        player.sendMessage("§6§lRichest Players §8(Top 10)")

        
        for (let i = 0; i < topPlayers.length; i++) {
            const entry = topPlayers[i]
            const color = i === 0 ? "§6§l" : i === 1 ? "§e§l" : i === 2 ? "§f§l" : "§7"
            player.sendMessage(`${color}${i + 1}. §f${entry.name} §8- §a$${entry.balance.toLocaleString()}`)
        }
        player.sendMessage(" ")
    }
}


