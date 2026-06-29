import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"
import { ValidationHelper } from "../../utils/ValidationHelper.js"

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
    parameters: [
        { name: "target", type: "player", optional: false },
        { name: "amount", type: "int", optional: false }
    ],

    async execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:pay <player> <amount>");
            player.sendMessage("§e§l» §fTip: §7Type a player name and an amount to send money.");
            return
        }


        // Resolve player from arguments (handles names with spaces)
        const { player: targetPlayer, consumedArgs } = PlayerUtils.resolveFromArgs(args)
        
        if (!targetPlayer) {
            player.sendMessage(`§c§l» §7Player '${args[0]}' not found or is offline.`);
            return
        }


        const amountStr = args.slice(consumedArgs).join(" ")
        const amount = Math.floor(parseFloat(amountStr))

        if (!ValidationHelper.isValidMoney(amount)) {
            player.sendMessage("§c§l» §7Invalid liquidity amount. Exceeds safe industrial bounds.");
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
            player.sendMessage("§c§l» §7Transaction failed. Please try again later.");
        }

    }
}

