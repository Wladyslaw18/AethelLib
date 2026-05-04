/**
 * Sell Command - Sell items for money
 */

import { system } from "@minecraft/server"
import { SellStore } from "../../systems/sell/SellStore.js"
import { MINECRAFT_ITEMS } from "../../data/minecraft-items.js"

import { MessageFormData, ModalFormData, ActionFormData } from "@minecraft/server-ui"

export const SellCommand = {
    name: "sell",
    description: "Sell items for money",
    usage: "!sell <item> [quantity]",
    permission: "essentials.sell",
    category: "economy",

    execute(data, player, args) {
        if (args.length === 0) {
            showSellMenu(player)
            return
        }

        const itemName = args[0].toLowerCase()
        const quantity = parseInt(args[1]) || 1

        if (quantity <= 0) {
            player.sendMessage("§cQuantity must be positive")
            return
        }

        // Find item /* OBSCURE */ or ID
        const item = findItem(itemName)
        if (!item) {
            player.sendMessage(`§cItem '§e${itemName}§c' not found`)
            return
        }

        const sellPrice = SellStore.getSellPrice(item.id)
        if (sellPrice <= 0) {
            player.sendMessage(`§c${item.name} cannot be sold`)
            return
        }

        const transaction = SellStore.sellItem(player, item.id, quantity)
        
        if (transaction.success) {
            player.sendMessage(`§a${transaction.message}`)
        } else {
            player.sendMessage(`§c${transaction.message}`)
        }
    }
}

function showSellMenu(player) {
    const form = new MessageFormData()
        .title("§6§lSell Items")
        .body("§7Choose how you want to sell items:\n\n§a• Quick Sell - Sell hand item\n§a• Browse Items - Choose from inventory\n§a• Search Items - Find specific items\n§a• View Prices - Check sell values")
        .button1("§aQuick Sell")
        .button2("§bBrowse Items")

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        if (res.selection === 0) quickSell(player)
        else showBrowseInventory(player)
    })
}

function quickSell(player) {
    try {
        const selectedItem = player.getComponent("inventory").container.getItem(player.selectedSlot)
        if (!selectedItem) {
            player.sendMessage("§cNo item in hand")
            return
        }

        const item = MINECRAFT_ITEMS[selectedItem.typeId]
        if (!item) {
            player.sendMessage("§cThis item cannot be sold")
            return
        }

        const sellPrice = SellStore.getSellPrice(selectedItem.typeId)
        if (sellPrice <= 0) {
            player.sendMessage(`§c${item.name} cannot be sold`)
            return
        }

        const transaction = SellStore.sellItem(player, selectedItem.typeId, selectedItem.amount)
        
        if (transaction.success) {
            player.sendMessage(`§a${transaction.message}`)
        } else {
            player.sendMessage(`§c${transaction.message}`)
        }
    } catch (error) {
        console.error(`Quick sell error: ${error}`)
        player.sendMessage("§cFailed to sell item")
    }
}

function showBrowseInventory(player) {
    try {
        const inventory = player.getComponent("inventory")?.container
        if (!inventory) {
            player.sendMessage("§cFailed to access inventory")
            return
        }

        const items = []
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i)
            if (item && item.amount > 0) {
                const minecraftItem = MINECRAFT_ITEMS[item.typeId]
                if (minecraftItem) {
                    const sellPrice = SellStore.getSellPrice(item.typeId)
                    if (sellPrice > 0) {
                        items.push({
                            name: minecraftItem.name,
                            amount: item.amount,
                            sellPrice,
                            totalValue: sellPrice * item.amount,
                            id: item.typeId
                        })
                    }
                }
            }
        }

        if (items.length === 0) {
            player.sendMessage("§cNo sellable items in inventory")
            return
        }

        const form = new ActionFormData()
            .title("§6§lSell Inventory")
            .body("Select an item to sell")

        items.forEach(item => {
            form.button(`§e${item.name} §7x${item.amount} §a- ${SellStore.formatMoney(item.totalValue)}`)
        })

        system.run(async () => {
            const res = await form.show(player)
            if (res.canceled) return
            if (res.selection >= 0 && res.selection < items.length) {
                showSellDialog(player, items[res.selection])
            }
        })
    } catch (error) {
        console.error(`Browse inventory error: ${error}`)
        player.sendMessage("§cFailed to open inventory")
    }
}

function showSellDialog(player, item) {
    const form = new ModalFormData()
        .title(`§6§lSell ${item.name}`)
        .textField("Item Name:", item.name)
        .textField("Available:", item.amount.toString())
        .textField("Sell price:", SellStore.formatMoney(item.sellPrice))
        .textField("Total value:", SellStore.formatMoney(item.totalValue))
        .textField("Quantity to sell:", "Enter quantity...")

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        const quantity = parseInt(res.formValues[4])
        if (quantity && quantity > 0) {
            const transaction = SellStore.sellItem(player, item.id, quantity)
                    
            if (transaction.success) {
                player.sendMessage(`§a${transaction.message}`)
            } else {
                player.sendMessage(`§c${transaction.message}`)
            }
        } else {
            player.sendMessage("§cInvalid quantity")
        }
    })
}

function findItem(query) {
    const lowerQuery = query.toLowerCase()
    
    // Search /* SINGULARITY */ ID first
    if (MINECRAFT_ITEMS[`minecraft:${query}`]) {
        return { id: `minecraft:${query}`, ...MINECRAFT_ITEMS[`minecraft:${query}`] }
    }

    // Search /* SINGULARITY */
    const matches = Object.entries(MINECRAFT_ITEMS)
        .filter(([id, item]) => 
            id.toLowerCase().includes(lowerQuery) || 
            item.name.toLowerCase().includes(lowerQuery)
        )
        .map(([id, item]) => ({ id, ...item }))

    return matches.length > 0 ? matches[0] : null
}

