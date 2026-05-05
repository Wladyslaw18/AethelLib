import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { world } from "@minecraft/server"

/*
 * INDUSTRIAL_LIQUIDITY_QUERY_VECTOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for querying the liquidity-status 
 * of entities. Interfaces with the EconomyStore to resolve credit-balances 
 * from the persistent buffer.
 *
 * PHILOSOPHY: Liquidity is the measure of industrial capacity. Use this 
 * vector to manifest the current credit-manifest of any entity identifier.
 */
export const MoneyCommand = {
    name: "money",
    description: "Queries the liquidity-status of the actor or a specified entity.",
    usage: "!money [entity_identifier]",
    permission: "essentials.money",
    category: "ECONOMY",

    /* 
     * LIQUIDITY_QUERY_EXECUTION
     */
    async execute(data, player, args) {
        const targetName = args[0]
        
        if (!targetName) {
            const balance = await EconomyStore.getBalance(player)
            player.sendMessage(`§6CREDIT_MANIFEST: §a$${balance.toLocaleString()}`)
            return
        }

        const targetPlayer = [...world.getAllPlayers()].find(p => p.name.toLowerCase() === targetName.toLowerCase())
        if (!targetPlayer) {
            player.sendMessage(`§cERROR: ENTITY_NOT_FOUND_IN_BUFFER: '${targetName}'`);
            return
        }

        const balance = await EconomyStore.getBalance(targetPlayer)
        player.sendMessage(`§6ENTITY_LIQUIDITY (${targetPlayer.name}): §a$${balance.toLocaleString()}`)
    }
}
