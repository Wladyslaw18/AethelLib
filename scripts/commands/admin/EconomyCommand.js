import { Kernel } from "../../core/Kernel.js";
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

// ----------------------------------------------------------------------------
// | object: EconomyCommand (Admin)                                           |
// | administrative command definition for managing player financial accounts. |
// | allows staff to override balances via give, take, set, or reset vectors.  |
// ----------------------------------------------------------------------------
export const EconomyCommand = {
    // internal identifier.
    name: "economy",
    // human-readable description.
    description: "Manage player balances",
    // syntax guide.
    usage: "/ae:economy <give|take|set|reset> <player_identifier> [amount]",
    // required permission node (staff only).
    permission: "essentials.admin.economy",
    // command category.
    category: "Admin",
    // native parameter definitions.
    parameters: [
        { name: "subcommand", type: "string", optional: true },
        { name: "player", type: "player", optional: true },
        { name: "amount", type: "int",    optional: true  }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the administrative routing engine. parses sub-vectors and delegates      |
    // | to specialized liquidity handlers.                                       |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax validation.
        if (args.length < 2) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:economy <give|take|set|reset> <player> [amount]");
            return
        }

        const subcommand = args[0].toLowerCase()
        const playerName = args[1]

        // step 1: entity resolution.
        // locate the target player object in the current Kernel.world buffer.
        const target = Kernel.world.getAllPlayers().find(p => p.name === playerName)
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${playerName}' not found.`);
            return
        }

        // step 2: routing.
        switch (subcommand) {
            case "give":
                // add funds to account.
                await handleGive(player, target, args[2])
                break
            case "take":
                // deduct funds from account.
                await handleTake(player, target, args[2])
                break
            case "set":
                // absolute balance calibration.
                await handleSet(player, target, args[2])
                break
            case "reset":
                // revert to industrial default balance.
                await handleReset(player, target)
                break
            default:
                player.sendMessage("\xA7c\xA7l» \xA77Invalid action. Use give, take, set, or reset.");
        }
    }
}

// ----------------------------------------------------------------------------
// | function: handleGive                                                     |
// | liquidity injection handler. increments the target's balance.             |
// ----------------------------------------------------------------------------
async function handleGive(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    // validate input amount.
    if (isNaN(amount) || amount <= 0) {
        executor.sendMessage("\xA7c\xA7l» \xA77Please provide a valid amount.");
        return
    }

    try {
        // execute atomic addition in the persistent store.
        const success = await EconomyStore.addMoney(target, amount)
        if (success) {
            executor.sendMessage(`\xA7a\xA7l» \xA7fAdded \xA7e$${amount.toLocaleString()}\xA7f to \xA7e${target.name}\xA7f's balance.`);
            target.sendMessage("\xA7a\xA7l» \xA7fYour balance was adjusted by an admin.");
        } else {
            executor.sendMessage("\xA7c\xA7l» \xA77Failed to add money.");
        }
    } catch (error) {
        executor.sendMessage(`\xA7c\xA7l[Critical] \xA77Transaction Crash: ${error.message}`);
    }
}

// ----------------------------------------------------------------------------
// | function: handleTake                                                     |
// | liquidity extraction handler. decrements the target's balance.            |
// ----------------------------------------------------------------------------
async function handleTake(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount <= 0) {
        executor.sendMessage("\xA7c\xA7l» \xA77Please provide a valid amount.");
        return
    }

    try {
        // execute atomic deduction. fails if funds are insufficient.
        const success = await EconomyStore.removeMoney(target, amount)
        if (success) {
            executor.sendMessage(`\xA7a\xA7l» \xA7fRemoved \xA7e$${amount.toLocaleString()}\xA7f from \xA7e${target.name}\xA7f's balance.`);
            target.sendMessage("\xA7a\xA7l» \xA7fYour balance was adjusted by an admin.");
        } else {
            executor.sendMessage("\xA7c\xA7l» \xA77Failed to remove money (Insufficient funds).");
        }
    } catch (error) {
        executor.sendMessage(`\xA7c\xA7l[Critical] \xA77Transaction Crash: ${error.message}`);
    }
}

// ----------------------------------------------------------------------------
// | function: handleSet                                                      |
// | absolute buffer calibration. forces a specific balance value.             |
// ----------------------------------------------------------------------------
async function handleSet(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount < 0) {
        executor.sendMessage("\xA7c\xA7l» \xA77Please provide a valid amount.");
        return
    }

    try {
        // force state update in the store.
        const success = await EconomyStore.setBalance(target, amount)
        if (success) {
            executor.sendMessage(`\xA7a\xA7l» \xA7fSet \xA7e${target.name}\xA7f's balance to \xA7e$${amount.toLocaleString()}\xA7f.`);
            target.sendMessage("\xA7a\xA7l» \xA7fYour balance was adjusted by an admin.");
        } else {
            executor.sendMessage("\xA7c\xA7l» \xA77Failed to set balance.");
        }
    } catch (error) {
        executor.sendMessage(`\xA7c\xA7l[Critical] \xA77Transaction Crash: ${error.message}`);
    }
}

// ----------------------------------------------------------------------------
// | function: handleReset                                                    |
// | buffer reset handler. restores account to the system default.            |
// ----------------------------------------------------------------------------
async function handleReset(executor, target) {
    try {
        // query the store for the constant default balance.
        const success = await EconomyStore.setBalance(target, EconomyStore.DEFAULT_BALANCE)
        if (success) {
            executor.sendMessage(`\xA7a\xA7l» \xA7fReset \xA7e${target.name}\xA7f's balance to \xA7e$${EconomyStore.DEFAULT_BALANCE.toLocaleString()}\xA7f.`);
            target.sendMessage("\xA7a\xA7l» \xA7fYour balance was reset by an admin.");
        } else {
            executor.sendMessage("\xA7c\xA7l» \xA77Failed to reset balance.");
        }
    } catch (error) {
        executor.sendMessage(`\xA7c\xA7l[Critical] \xA77Transaction Crash: ${error.message}`);
    }
}
