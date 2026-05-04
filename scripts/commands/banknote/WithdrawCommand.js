/**
 * Withdraw Command - Convert money to physical banknotes
 */

import { system, world, ItemStack } from "@minecraft/server"
import { BanknoteStore } from "../../systems/banknote/BanknoteStore.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

export const WithdrawCommand = {
    name: "withdraw",
    description: "Convert money to physical banknotes",
    usage: "!withdraw <amount>",
    permission: "essentials.withdraw",
    category: "economy",

    execute(data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§cUsage: !withdraw <amount>")
            player.sendMessage("§7Example: !withdraw 1000")
            return
        }

        const amount = parseInt(args[0])
        
        if (isNaN(amount) || amount <= 0) {
            player.sendMessage("§cAmount must be a positive number")
            return
        }

        if (amount < 100) {
            player.sendMessage("§cMinimum withdrawal amount is §e$100")
            return
        }

        if (amount > 1000000) {
            player.sendMessage("§cMaximum withdrawal amount is §e$1,000,000")
            return
        }

        // Check player balance
        const balance = EconomyStore.getBalance(player.id)
        if (balance < amount) {
            player.sendMessage(`§cInsufficient funds. You have ${BanknoteStore.formatMoney(balance)}`)
            return
        }

        // Check inventory space
        const requiredSlots = Math.ceil(amount / 64000) // Max 64K per stack
        const availableSlots = getAvailableInventorySlots(player)
        
        if (availableSlots < requiredSlots) {
            player.sendMessage(`§cNot enough inventory space. Need ${requiredSlots} slots, have ${availableSlots}`)
            return
        }

        // Process withdrawal
        system.run(() => {
            try {
                // Remove money from account
                if (!EconomyStore.removeMoney(player.id, amount)) {
                    player.sendMessage("§cFailed to withdraw money")
                    return
                }

                // Create banknotes
                const created = createBanknotes(player, amount)
                
                if (created > 0) {
                    player.sendMessage(`§aSuccessfully withdrew ${BanknoteStore.formatMoney(amount)} into ${created} banknote(s)`)
                    player.sendMessage("§7Right-click banknotes to redeem them")
                } else {
                    // Refund money if failed to create items
                    EconomyStore.addMoney(player.id, amount)
                    player.sendMessage("§cFailed to create banknotes. Money refunded.")
                }
            } catch (error) {
                console.error(`Withdraw error: ${error}`)
                player.sendMessage("§cAn error occurred during withdrawal")
                // Refund money on error
                EconomyStore.addMoney(player.id, amount)
            }
        })
    }
}

function createBanknotes(player, totalAmount) {
    const denominations = [1000000, 500000, 100000, 50000, 10000, 5000, 1000, 500, 100]
    let remaining = totalAmount
    let created = 0

    for (const denom of denominations) {
        while (remaining >= denom) {
            const banknote = BanknoteStore.createBanknote(denom, player.id, player.name)
            
            // Store banknote data
            if (!BanknoteStore.storeBanknoteData(banknote)) {
                console.error(`Failed to store banknote data for ${banknote.id}`)
                continue
            }

            // Create physical item
            const item = new ItemStack(BanknoteStore.getBanknoteId(), 1)
            item.nameTag = BanknoteStore.getBanknoteName(denom)
            item.setLore(BanknoteStore.getBanknoteLore(banknote))
            
            // Give item to player
            const container = player.getComponent("inventory").container
            const success = container.addItem(item)
            
            if (success) {
                remaining -= denom
                created++
            } else {
                // Inventory full, stop creating
                break
            }
        }
        
        if (remaining < 100) break // Stop if remaining is below minimum
    }

    // Refund any remaining amount that couldn't be converted
    if (remaining > 0) {
        EconomyStore.addMoney(player.id, remaining)
        player.sendMessage(`§7Could not convert ${BanknoteStore.formatMoney(remaining)} - refunded to account`)
    }

    return created
}

function getAvailableInventorySlots(player) {
    try {
        const container = player.getComponent("inventory").container
        let available = 0
        
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i)
            if (!item) {
                available++
            } else if (item.typeId === BanknoteStore.getBanknoteId() && item.amount < 64) {
                // Can add to existing stack
                available++
            }
        }
        
        return available
    } catch (error) {
        console.error(`Failed to check inventory space: ${error}`)
        return 0
    }
}

