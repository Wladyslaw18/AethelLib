import { world } from "@minecraft/server"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

/*
 * Economy Admin Command
 * ----------------------------------------------------------------------------
 * Allows admins to manage player balances (give, take, set, reset).
 */

export const EconomyCommand = {
    name: "economy",
    description: "Manage player balances",

    usage: "/ae:economy <give|take|set|reset> <player_identifier> [amount]",
    permission: "essentials.admin.economy",
    category: "Admin",
    parameters: [
        { name: "subcommand", type: "string", optional: true },
        { name: "player", type: "player", optional: true },
        { name: "amount", type: "int",    optional: true  }
    ],

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    async execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:economy <give|take|set|reset> <player> [amount]");
            return
        }


        const subcommand = args[0].toLowerCase()
        const playerName = args[1]

        /* 
         * ENTITY_RESOLUTION
         */
        const target = world.getAllPlayers().find(p => p.name === playerName)
        if (!target) {
            player.sendMessage(`§c§l» §7Player '${playerName}' not found.`);
            return
        }


        switch (subcommand) {
            case "give":
                await handleGive(player, target, args[2])
                break
            case "take":
                await handleTake(player, target, args[2])
                break
            case "set":
                await handleSet(player, target, args[2])
                break
            case "reset":
                await handleReset(player, target)
                break
            default:
                player.sendMessage("§c§l» §7Invalid action. Use give, take, set, or reset.");
        }

    }
}

/* 
 * LIQUIDITY_INJECTION_HANDLER
 */
async function handleGive(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount <= 0) {
        executor.sendMessage("§c§l» §7Please provide a valid amount.");
        return
    }


    try {
        const success = await EconomyStore.addMoney(target, amount)
        if (success) {
            executor.sendMessage(`§a§l» §fAdded §e$${amount.toLocaleString()}§f to §e${target.name}§f's balance.`);
            target.sendMessage("§a§l» §fYour balance was adjusted by an admin.");
        } else {
            executor.sendMessage("§c§l» §7Failed to add money.");
        }

    } catch (error) {
        executor.sendMessage(`[Critical] Transaction Crash: ${error.message}`);
    }
}

/* 
 * LIQUIDITY_EXTRACTION_HANDLER
 */
async function handleTake(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount <= 0) {
        executor.sendMessage("§c§l» §7Please provide a valid amount.");
        return
    }


    try {
        const success = await EconomyStore.removeMoney(target, amount)
        if (success) {
            executor.sendMessage(`§a§l» §fRemoved §e$${amount.toLocaleString()}§f from §e${target.name}§f's balance.`);
            target.sendMessage("§a§l» §fYour balance was adjusted by an admin.");
        } else {
            executor.sendMessage("§c§l» §7Failed to remove money (Insufficient funds).");
        }

    } catch (error) {
        executor.sendMessage(`[Critical] Transaction Crash: ${error.message}`);
    }
}

/* 
 * BUFFER_CALIBRATION_HANDLER
 */
async function handleSet(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount < 0) {
        executor.sendMessage("§c§l» §7Please provide a valid amount.");
        return
    }


    try {
        const success = await EconomyStore.setBalance(target, amount)
        if (success) {
            executor.sendMessage(`§a§l» §fSet §e${target.name}§f's balance to §e$${amount.toLocaleString()}§f.`);
            target.sendMessage("§a§l» §fYour balance was adjusted by an admin.");
        } else {
            executor.sendMessage("§c§l» §7Failed to set balance.");
        }

    } catch (error) {
        executor.sendMessage(`[Critical] Transaction Crash: ${error.message}`);
    }
}

/* 
 * BUFFER_RESET_HANDLER
 */
async function handleReset(executor, target) {
    try {
        const success = await EconomyStore.setBalance(target, EconomyStore.DEFAULT_BALANCE)
        if (success) {
            executor.sendMessage(`§a§l» §fReset §e${target.name}§f's balance to §e$${EconomyStore.DEFAULT_BALANCE.toLocaleString()}§f.`);
            target.sendMessage("§a§l» §fYour balance was reset by an admin.");
        } else {
            executor.sendMessage("§c§l» §7Failed to reset balance.");
        }

    } catch (error) {
        executor.sendMessage(`[Critical] Transaction Crash: ${error.message}`);
    }
}
