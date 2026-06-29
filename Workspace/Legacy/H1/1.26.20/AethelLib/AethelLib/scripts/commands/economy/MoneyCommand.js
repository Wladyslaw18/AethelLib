import { world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"


/*
 * Money Command
 * ----------------------------------------------------------------------------
 * Allows players to check their own balance or the balance of others.
 */

export const MoneyCommand = {
    name: "money",
    description: "View your money or another player's balance",


    usage: "/ae:money [entity_identifier]",
    permission: "essentials.money",
    category: "ECONOMY",
    parameters: [
        { name: "target", type: "player", optional: true }
    ],

    /* 
     * LIQUIDITY_QUERY_EXECUTION
     */
    async execute(_data, player, args) {
        const targetName = args[0]
        
        if (!targetName) {
            const balance = EconomyStore.getBalance(player)
            player.sendMessage(`§a§l» §fYour balance: §e$${balance.toLocaleString()}§f.`);
            return
        }


        // Search for online or known players
        const targetPlayer = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        
        if (targetPlayer) {
            const balance = EconomyStore.getBalance(targetPlayer)
            player.sendMessage(`§a§l» §f${targetPlayer.name}'s balance: §e$${balance.toLocaleString()}§f.`);
        } else {

            // Check the database for offline names
            const Database = Kernel.get("database")
            const ids = world.getDynamicPropertyIds()
            const namePattern = /^player:(.+):name$/
            let foundId = null
            let foundName = null

            for (const id of ids) {
                const match = id.match(namePattern)
                if (match) {
                    const name = Database.get(id)
                    if (name && typeof name === "string" && name.toLowerCase() === targetName.toLowerCase()) {
                        foundId = match[1]
                        foundName = name
                        break
                    }
                }
            }

            if (foundId) {
                const balance = Database.get(`player:${foundId}:money`) || 0
                player.sendMessage(`§a§l» §f${foundName}'s balance: §e$${balance.toLocaleString()}§f.`);
            } else {

                player.sendMessage(`§c§l» §7Player '${targetName}' not found.`);
            }

        }
    }
}

