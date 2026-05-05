import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { world } from "@minecraft/server"

/*
 * INDUSTRIAL_LIQUIDITY_HIERARCHY_MANIFEST
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for querying the global credit-hierarchy. 
 * Resolves the liquidity-status of all online entities and executes an 
 * O(N log N) sorting operation to manifest the top-tier credit-anchors.
 *
 * PHILOSOPHY: Hierarchy is the structure of success. Use this manifest 
 * to identify the primary drivers of the industrial economy.
 */
export const TopMoneyCommand = {
    name: "topmoney",
    description: "Queries the system for the global liquidity-hierarchy (Top 10).",
    usage: "!topmoney",
    permission: "essentials.money",
    category: "ECONOMY",

    /* 
     * HIERARCHY_QUERY_EXECUTION
     */
    async execute(data, player, args) {
        const onlinePlayers = world.getAllPlayers()
        if (onlinePlayers.length === 0) return

        /* LIQUIDITY_DATA_RESOLUTION */
        const playerBalances = []
        for (const p of onlinePlayers) {
            const balance = await EconomyStore.getBalance(p)
            playerBalances.push({ name: p.name, balance: balance })
        }

        /* HIERARCHY_SORTATION_VECTOR */
        playerBalances.sort((a, b) => b.balance - a.balance)
        const topPlayers = playerBalances.slice(0, 10)

        player.sendMessage("§0§l» §6§lLIQUIDITY_HIERARCHY_REPORT§0 «")
        if (topPlayers.length === 0) {
            player.sendMessage("§cERROR: LIQUIDITY_BUFFER_EMPTY");
            return
        }

        for (let i = 0; i < topPlayers.length; i++) {
            const entry = topPlayers[i]
            const rankPrefix = i === 0 ? "§e[RANK_01]" : i === 1 ? "§7[RANK_02]" : i === 2 ? "§6[RANK_03]" : `§f[RANK_${String(i + 1).padStart(2, '0')}]`
            player.sendMessage(`${rankPrefix} §e${entry.name}: §a$${entry.balance.toLocaleString()}`)
        }
    }
}
