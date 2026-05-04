/**
 * Economy Admin Command - Manage player money
 */

import { world } from "@minecraft/server"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

export const EconomyCommand = {
    name: "economy",
    description: "Manage player economy",
    usage: "!economy <give|take|set|reset> <playerName> [amount]",
    permission: "essentials.admin.economy",
    category: "admin",

    async execute(data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§cUsage: !economy <give|take|set|reset> <playerName> [amount]")
            return
        }

        const subcommand = args[0].toLowerCase()
        const playerName = args[1]

        // Find target player
        const target = world.getAllPlayers().find(p => p.name === playerName)
        if (!target) {
            player.sendMessage(`§cPlayer '${playerName}' not found or not online`)
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
                player.sendMessage("§cUsage: !economy <give|take|set|reset> <playerName> [amount]")
        }
    }
}

async function handleGive(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount <= 0) {
        executor.sendMessage("§cAmount must be a positive integer")
        return
    }

    try {
        const success = await EconomyStore.addMoney(target, amount)
        if (success) {
            executor.sendMessage(`§aSuccessfully gave §e${amount} §ato ${target.name}`)
            target.sendMessage("§e[Economy] An admin adjusted your balance.")
        } else {
            executor.sendMessage("§cFailed to give money to player")
        }
    } catch (error) {
        executor.sendMessage(`§cError giving money: ${error.message}`)
    }
}

async function handleTake(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount <= 0) {
        executor.sendMessage("§cAmount must be a positive integer")
        return
    }

    try {
        const success = await EconomyStore.removeMoney(target, amount)
        if (success) {
            executor.sendMessage(`§aSuccessfully took §e${amount} §afrom ${target.name}`)
            target.sendMessage("§e[Economy] An admin adjusted your balance.")
        } else {
            executor.sendMessage("§cFailed to take money from player (insufficient funds or error)")
        }
    } catch (error) {
        executor.sendMessage(`§cError taking money: ${error.message}`)
    }
}

async function handleSet(executor, target, amountStr) {
    const amount = Math.floor(Number(amountStr))
    if (isNaN(amount) || amount < 0) {
        executor.sendMessage("§cAmount must be a non-negative integer")
        return
    }

    try {
        const success = await EconomyStore.setBalance(target, amount)
        if (success) {
            executor.sendMessage(`§aSuccessfully set ${target.name}'s balance to §e${amount}`)
            target.sendMessage("§e[Economy] An admin adjusted your balance.")
        } else {
            executor.sendMessage("§cFailed to set player balance")
        }
    } catch (error) {
        executor.sendMessage(`§cError setting balance: ${error.message}`)
    }
}

async function handleReset(executor, target) {
    try {
        const success = await EconomyStore.setBalance(target, EconomyStore.DEFAULT_BALANCE)
        if (success) {
            executor.sendMessage(`§aSuccessfully reset ${target.name}'s balance to §e${EconomyStore.DEFAULT_BALANCE}`)
            target.sendMessage("§e[Economy] An admin adjusted your balance.")
        } else {
            executor.sendMessage("§cFailed to reset player balance")
        }
    } catch (error) {
        executor.sendMessage(`§cError resetting balance: ${error.message}`)
    }
}

