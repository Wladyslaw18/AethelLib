import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"
import { ValidationHelper } from "../../utils/ValidationHelper.js"

// ----------------------------------------------------------------------------
// | object: PayCommand                                                       |
// | command definition for P2P financial transfers.                           |
// | routes funds between players with strict validation and atomic safety.    |
// ----------------------------------------------------------------------------
export const PayCommand = {
    // internal name.
    name: "pay",
    // human-readable description.
    description: "Send money to another player",
    // syntax guide.
    usage: "/ae:pay <player> <amount>",
    // required permission level.
    permission: "essentials.pay",
    // command category.
    category: "ECONOMY",
    // native parameter definitions.
    parameters: [
        { name: "target", type: "player", optional: false },
        { name: "amount", type: "int", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the transaction pipeline. handles input parsing, safety checks, and       |
    // | triggers the atomic transfer logic in the economy store.                 |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax validation.
        if (args.length < 2) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:pay <player> <amount>");
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Type a player name and an amount to send money.");
            return
        }

        // resolve the target player from the argument array.
        // handles multi-word player names (greedy parsing).
        const { player: targetPlayer, consumedArgs } = PlayerUtils.resolveFromArgs(args)
        
        // ensure the target is online.
        if (!targetPlayer) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${args[0]}' not found or is offline.`);
            return
        }

        // the argument after the player name is the numerical amount.
        const amountStr = args.slice(consumedArgs).join(" ")
        // parse and floor to prevent floating point nonsense.
        const amount = Math.floor(parseFloat(amountStr))

        // step 1: industrial validation.
        // check if the amount is a positive integer and within safe limits.
        if (!ValidationHelper.isValidMoney(amount)) {
            player.sendMessage("\xA7c\xA7l» \xA77Invalid liquidity amount. Exceeds safe industrial bounds.");
            return
        }

        // step 2: self-payment block.
        // prevents infinite money loops (if bugs exist) or just general silliness.
        if (targetPlayer.id === player.id) {
            player.sendMessage("\xA7c\xA7l» \xA77You cannot pay yourself!");
            return
        }

        // step 3: liquidity check.
        // check if the sender actually has enough money to fulfill the request.
        const hasEnough = await EconomyStore.hasEnough(player, amount)
        if (!hasEnough) {
            const balance = await EconomyStore.getBalance(player)
            player.sendMessage(`\xA7c\xA7l» \xA77Insufficient funds. Balance: \xA7a$${balance.toLocaleString()}`);
            return
        }

        // step 4: atomic transfer.
        // call the economy store to execute the move. this uses nested transactions
        // and rollback logic internally to ensure data integrity.
        const success = await EconomyStore.transferMoney(player, targetPlayer, amount)

        if (success) {
            // notify both parties of the successful transfer.
            player.sendMessage(`\xA7a\xA7l» \xA7fSent \xA7e$${amount.toLocaleString()}\xA7f to \xA7e${targetPlayer.name}\xA7f.`);
            targetPlayer.sendMessage(`\xA7a\xA7l» \xA7fReceived \xA7e$${amount.toLocaleString()}\xA7f from \xA7e${player.name}\xA7f.`);
        } else {
            // if the transaction failed (database lock, etc).
            player.sendMessage("\xA7c\xA7l» \xA77Transaction failed. Please try again later.");
        }
    }
}
