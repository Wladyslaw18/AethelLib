import { Kernel } from "../../core/Kernel.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

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
        // args[0] is a Player object! args[1] is an actual Integer! C++ is pure magic.
        const [targetPlayer, amount] = args;

        if (!targetPlayer || amount === undefined) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:pay <player> <amount>");
            return;
        }

        // step 1: prevent paying yourself. if you have no friends, that's sad, but don't exploit the server trying to clone coins.
        if (targetPlayer.id === player.id) {
            player.sendMessage("\xA7c\xA7l» \xA77You cannot pay yourself!");
            return;
        }

        // step 2: validate positive amounts. zero or negative is how we get database rollbacks. nice try, script kiddies.
        if (amount <= 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Amount must be a positive integer.");
            return;
        }

        // step 3: liquidity check. do they actually have the money or is this a scam?
        const hasEnough = await EconomyStore.hasEnough(player, amount);
        if (!hasEnough) {
            const balance = await EconomyStore.getBalance(player);
            player.sendMessage(`\xA7c\xA7l» \xA77Insufficient funds. Balance: \xA7a$${balance.toLocaleString()}`);
            return;
        }

        // step 4: atomic transfer. transactional safety handles rolling back if the thread locks.
        const success = await EconomyStore.transferMoney(player, targetPlayer, amount);

        if (success) {
            player.sendMessage(`\xA7a\xA7l» \xA7fSent \xA7e$${amount.toLocaleString()}\xA7f to \xA7e${targetPlayer.name}\xA7f.`);
            targetPlayer.sendMessage(`\xA7a\xA7l» \xA7fReceived \xA7e$${amount.toLocaleString()}\xA7f from \xA7e${player.name}\xA7f.`);
        } else {
            // database lock or weird engine bug. cry in a corner then tell them to try again.
            player.sendMessage("\xA7c\xA7l» \xA77Transaction failed. Please try again later.");
        }
    }
}
