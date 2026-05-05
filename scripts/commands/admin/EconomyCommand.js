import { world } from "@minecraft/server"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

/*
 * ADMINISTRATIVE_ECONOMY_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-clearance interface for direct manipulation of player liquidity 
 * buffers. Orchestrates atomic 'give', 'take', 'set', and 'reset' 
 * operations via the EconomyStore.
 *
 * PHILOSOPHY: Money is data. Control the data, control the economy. 
 * Use this vector to correct structural financial imbalances.
 */
export const EconomyCommand = {
    name: "economy",
    description: "Orchestrates administrative liquidity-buffer mutations.",
    usage: "!economy <give|take|set|reset> <player_identifier> [amount]",
    permission: "essentials.admin.economy",
    category: "Admin",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    async execute(data, player, args) {
        if (args.length < 2) {
            player.sendMessage("[Manual] Syntax Error: Action and player identifier required.");
            return
        }

        const subcommand = args[0].toLowerCase()
        const playerName = args[1]

        /* 
         * ENTITY_RESOLUTION
         */
        const target = world.getAllPlayers().find(p => p.name === playerName)
        if (!target) {
            player.sendMessage(`[Error] Entity '${playerName}' not found in active buffer.`);
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
                player.sendMessage("[Manual] Syntax Error: Invalid administrative action.");
        }
    }
}

/* 
 * LIQUIDITY_INJECTION_HANDLER
 */
async function handleGive(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount <= 0) {
        executor.sendMessage("[Error] Calibration Error: Amount must be a positive integer.");
        return
    }

    try {
        const success = await EconomyStore.addMoney(target, amount)
        if (success) {
            executor.sendMessage(`[Success] Injected ${amount} credits into '${target.name}' buffer.`);
            target.sendMessage("[System] Administrative balance adjustment detected.");
        } else {
            executor.sendMessage("[Fatal] Injection failure.");
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
        executor.sendMessage("[Error] Calibration Error: Amount must be a positive integer.");
        return
    }

    try {
        const success = await EconomyStore.removeMoney(target, amount)
        if (success) {
            executor.sendMessage(`[Success] Extracted ${amount} credits from '${target.name}' buffer.`);
            target.sendMessage("[System] Administrative balance adjustment detected.");
        } else {
            executor.sendMessage("[Error] Extraction failure: Insufficient liquidity in buffer.");
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
        executor.sendMessage("[Error] Calibration Error: Amount must be a non-negative integer.");
        return
    }

    try {
        const success = await EconomyStore.setBalance(target, amount)
        if (success) {
            executor.sendMessage(`[Success] Calibrated '${target.name}' balance to ${amount} credits.`);
            target.sendMessage("[System] Administrative balance adjustment detected.");
        } else {
            executor.sendMessage("[Fatal] Calibration failure.");
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
            executor.sendMessage(`[Success] Reset '${target.name}' buffer to industrial default: ${EconomyStore.DEFAULT_BALANCE}`);
            target.sendMessage("[System] Administrative balance adjustment detected.");
        } else {
            executor.sendMessage("[Fatal] Reset failure.");
        }
    } catch (error) {
        executor.sendMessage(`[Critical] Transaction Crash: ${error.message}`);
    }
}
