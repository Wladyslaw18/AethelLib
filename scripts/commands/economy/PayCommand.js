import { Kernel } from "../../core/Kernel.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: PayCommand                                                       |
// | transfers credits between players.                                       |
// | no more nasty string parsing or regex loops! C++ does the hard work now. |
// ----------------------------------------------------------------------------
export const PayCommand = {
    name: "pay",
    description: "Send money to another player",
    usage: "/ae:pay <player> <amount>",
    permission: "essentials.pay",
    category: "ECONOMY",
    
    // C++ NATIVE PARAMS SCHEMA. AUTODETECTION AND AUTOCOMPLETE IS ACTIVE!
    params: [
        { name: "target", type: Kernel.CustomCommandParamType.PlayerSelector, optional: false },
        { name: "amount", type: Kernel.CustomCommandParamType.Integer, optional: false }
    ],

    async execute(_data, player, args) {
        let targetPlayer = args[0];
        const amount = args[1];

        // Resolve targetPlayer robustly (handles autocomplete Player objects, raw/quoted strings, etc.)
        if (targetPlayer !== undefined && targetPlayer !== null) {
            targetPlayer = PlayerUtils.findPlayer(targetPlayer);
        }

        if (!targetPlayer || amount === undefined) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:pay <player> <amount>");
            return;
        }

        // step 1: prevent paying yourself. if you have no friends, that's sad, but don't exploit the server trying to clone coins.
        if (targetPlayer.id === player.id) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot pay yourself!");
            return;
        }

        // step 2: validate positive amounts. zero or negative is how we get database rollbacks. nice try, script kiddies.
        if (amount <= 0) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Amount must be a positive integer.");
            return;
        }

        // step 3: liquidity check. do they actually have the money or is this a scam?
        const hasEnough = await EconomyStore.hasEnough(player, amount);
        if (!hasEnough) {
            const balance = await EconomyStore.getBalance(player);
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Insufficient funds. Balance: \u00A7a$${balance.toLocaleString()}`);
            return;
        }

        // step 4: atomic transfer. transactional safety handles rolling back if the thread locks.
        const success = await EconomyStore.transferMoney(player, targetPlayer, amount);

        if (success) {
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fSent \u00A7e$${amount.toLocaleString()}\u00A7f to \u00A7e${targetPlayer.name}\u00A7f.`);
            targetPlayer.sendMessage(`\u00A7a\u00A7l» \u00A7fReceived \u00A7e$${amount.toLocaleString()}\u00A7f from \u00A7e${player.name}\u00A7f.`);
        } else {
            // database lock or weird engine bug. cry in a corner then tell them to try again.
            player.sendMessage("\u00A7c\u00A7l» \u00A77Transaction failed. Please try again later.");
        }
    }
}
