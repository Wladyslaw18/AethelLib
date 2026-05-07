import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

/*
 * Pay Command
 * ----------------------------------------------------------------------------
 * Handles sending money between players.
 */

export const PayCommand = {
    name: "pay",
    description: "Send money to another player",

    usage: "/ae:pay <player> <amount>",

    permission: "essentials.pay",
    category: "ECONOMY",
    // No explicit parameters to allow the CommandManager catch-all to handle spaces

    async execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:pay <player> <amount>");
            return
        }


        // Resolve player from arguments (handles names with spaces)

        const { player: targetPlayer, consumedArgs } = PlayerUtils.resolveFromArgs(args)
        
        if (!targetPlayer) {
            player.sendMessage(`§c§l» §7Player '${args[0]}' not found.`);
            return
        }


        const amountStr = args.slice(consumedArgs).join(" ")
        const amount = parseFloat(amountStr)

        if (isNaN(amount) || amount <= 0 || !Number.isFinite(amount)) {
            player.sendMessage("§c§l» §7Please provide a valid amount.");
            return
        }


        if (targetPlayer.id === player.id) {
            player.sendMessage("§c§l» §7You cannot pay yourself!");
            return
        }


        const hasEnough = await EconomyStore.hasEnough(player, amount)
        if (!hasEnough) {
            const balance = await EconomyStore.getBalance(player)
            player.sendMessage(`§c§l» §7Insufficient funds. Balance: §a$${balance.toLocaleString()}`);
            return
        }


        const success = await EconomyStore.transferMoney(player, targetPlayer, amount)

        if (success) {
            player.sendMessage(`§a§l» §fSent §e$${amount.toLocaleString()}§f to §e${targetPlayer.name}§f.`);
            targetPlayer.sendMessage(`§a§l» §fReceived §e$${amount.toLocaleString()}§f from §e${player.name}§f.`);
        } else {
            player.sendMessage("§c§l» §7Failed to process payment.");
        }

    }
}
