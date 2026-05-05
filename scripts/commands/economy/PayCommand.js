import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { world } from "@minecraft/server"

/*
 * INDUSTRIAL_LIQUIDITY_TRANSFER_VECTOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the atomic transfer of credits 
 * between entity liquidity-buffers. Performs rigorous validation of 
 * transfer-amounts and entity-availability.
 *
 * PHILOSOPHY: Credits are the fuel of industry. Use this vector to 
 * redistribute liquidity across the entity-registry with zero-loss 
 * atomic commitment.
 */
export const PayCommand = {
    name: "pay",
    description: "Executes a peer-to-peer liquidity-transfer to another entity.",
    usage: "!pay <entity_identifier> <credit_amount>",
    permission: "essentials.pay",
    category: "ECONOMY",

    /* 
     * TRANSFER_EXECUTION_PIPELINE
     */
    async execute(data, player, args) {
        const targetName = args[0]
        const amountStr = args[1]

        if (!targetName || !amountStr) {
            player.sendMessage("§cSYNTAX_ERROR: Usage: !pay <entity_identifier> <credit_amount>");
            return
        }

        const amount = parseFloat(amountStr)
        if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount)) {
            player.sendMessage("§cVALIDATION_FAILURE: Credit_amount must be a positive finite integer.");
            return
        }

        if (amount < 1) {
            player.sendMessage("§cVALIDATION_FAILURE: MINIMUM_TRANSFER_THRESHOLD: $1");
            return
        }

        const targetPlayer = [...world.getAllPlayers()].find(p => p.name.toLowerCase() === targetName.toLowerCase())
        if (!targetPlayer) {
            player.sendMessage(`§cERROR: ENTITY_NOT_FOUND_IN_BUFFER: '${targetName}'`);
            return
        }

        if (targetPlayer.id === player.id) {
            player.sendMessage("§cERROR: SELF_TRANSFER_PROHIBITED");
            return
        }

        /* LIQUIDITY_VALUATION_CHECK */
        const hasEnough = await EconomyStore.hasEnough(player, amount)
        if (!hasEnough) {
            const balance = await EconomyStore.getBalance(player)
            player.sendMessage(`§cINSUFFICIENT_LIQUIDITY: HAVE: §a$${balance.toLocaleString()} §c| NEED: §a$${amount.toLocaleString()}`);
            return
        }

        /* ATOMIC_TRANSFER_COMMIT */
        const success = await EconomyStore.transferMoney(player, targetPlayer, amount)

        if (success) {
            player.sendMessage(`§aTRANSFER_COMPLETE: Sent §e$${amount.toLocaleString()} §a to §6${targetPlayer.name}`);
            targetPlayer.sendMessage(`§aLIQUIDITY_INJECTION: Received §e$${amount.toLocaleString()} §a from §6${player.name}`);
        } else {
            player.sendMessage("§cERROR: ATOMIC_COMMIT_FAILURE: RETRY_PROTOCOL_REQUIRED");
        }
    }
}
