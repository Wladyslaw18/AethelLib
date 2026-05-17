import { system } from "@minecraft/server"
import { SellStore } from "../../systems/sell/SellStore.js"
import { MINECRAFT_ITEMS } from "../../data/minecraft-items.js"
import { MessageFormData, ModalFormData, ActionFormData } from "@minecraft/server-ui"

// ----------------------------------------------------------------------------
// | object: SellCommand                                                      |
// | command definition for the centralized liquidation pipeline.              |
// | supports direct command input, hand-held selling, and visual browsing.    |
// ----------------------------------------------------------------------------
export const SellCommand = {
    // internal identifier.
    name: "sell",
    // human-readable description.
    description: "Sell items for money",
    // syntax guide.
    usage: "/ae:sell <item> [quantity]",
    // required permission node.
    permission: "essentials.sell",
    // command category.
    category: "economy",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for the liquidation vector. routes to UI if no args,         |
    // | otherwise processes direct item removal and payout.                      |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // case 1: no arguments. trigger the visual sell management dashboard.
        if (args.length === 0) {
            showSellMenu(player)
            return
        }

        // case 2: direct command input.
        const itemName = args[0].toLowerCase()
        const quantity = parseInt(args[1]) || 1

        // quantity validation.
        if (quantity <= 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Quantity must be positive.");
            return
        }

        // step 1: item resolution.
        // search the industrial catalog for the target item.
        const item = findItem(itemName)
        if (!item) {
            player.sendMessage(`\xA7c\xA7l» \xA77Item '\xA7e${itemName}\xA77' not found in catalog.`);
            return
        }

        // step 2: valuation check.
        // verify the item has a non-zero liquidity value in the sell store.
        const sellPrice = SellStore.getSellPrice(item.id)
        if (sellPrice <= 0) {
            player.sendMessage(`\xA7c\xA7l» \xA7e${item.name} \xA77cannot be liquidated.`);
            return
        }

        // step 3: transaction execution.
        // trigger the removal and payout sequence.
        const transaction = SellStore.sellItem(player, item.id, quantity)
        
        if (transaction.success) {
            player.sendMessage(`\xA7a\xA7l» \xA7f${transaction.message}`);
        } else {
            // display error (e.g. insufficient items in inventory).
            player.sendMessage(`\xA7c\xA7l» \xA77${transaction.message}`);
        }
    }
}

// ----------------------------------------------------------------------------
// | function: showSellMenu                                                   |
// | visual dashboard for choosing between quick hand-selling and browsing.    |
// ----------------------------------------------------------------------------
function showSellMenu(player) {
    const form = new MessageFormData()
        .title("\xA76\xA7lSell Items")
        .body("\xA77Choose how you want to sell items:\n\n\xA7a• Quick Sell - Sell hand item\n\xA7a• Browse Items - Choose from inventory\n\xA7a• Search Items - Find specific items\n\xA7a• View Prices - Check sell values")
        .button1("\xA7aQuick Sell")
        .button2("\xA7bBrowse Items")

    // execute on next tick to satisfy engine UI constraints.
    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        if (res.selection === 0) quickSell(player)
        else showBrowseInventory(player)
    })
}

// ----------------------------------------------------------------------------
// | function: quickSell                                                      |
// | liquidates the item currently held in the player's primary slot.         |
// ----------------------------------------------------------------------------
function quickSell(player) {
    try {
        // fetch item from current slot.
        const selectedItem = player.getComponent("inventory").container.getItem(player.selectedSlot)
        if (!selectedItem) {
            player.sendMessage("\xA7c\xA7l» \xA77No item in hand.");
            return
        }

        // map to catalog definition.
        const item = MINECRAFT_ITEMS[selectedItem.typeId]
        if (!item) {
            player.sendMessage("\xA7c\xA7l» \xA77This item cannot be sold.");
            return
        }

        // resolve valuation.
        const sellPrice = SellStore.getSellPrice(selectedItem.typeId)
        if (sellPrice <= 0) {
            player.sendMessage(`\xA7c\xA7l» \xA7e${item.name} \xA77cannot be sold.`);
            return
        }

        // execute transaction.
        const transaction = SellStore.sellItem(player, selectedItem.typeId, selectedItem.amount)
        
        if (transaction.success) {
            player.sendMessage(`\xA7a\xA7l» \xA7f${transaction.message}`);
        } else {
            player.sendMessage(`\xA7c\xA7l» \xA77${transaction.message}`);
        }
    } catch (error) {
        console.error(`Quick sell error: ${error}`)
        player.sendMessage("\xA7c\xA7l» \xA77Failed to sell item.");
    }
}

// ----------------------------------------------------------------------------
// | function: showBrowseInventory                                            |
// | scans the player container and presents a menu of all sellable assets.   |
// ----------------------------------------------------------------------------
function showBrowseInventory(player) {
    try {
        const inventory = player.getComponent("inventory")?.container
        if (!inventory) {
            player.sendMessage("\xA7c\xA7l» \xA77Failed to access inventory.");
            return
        }

        const items = []
        // scan all slots for assets with non-zero liquidation value.
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
            player.sendMessage("\xA7c\xA7l» \xA77No sellable items in inventory.");
            return
        }

        const form = new ActionFormData()
            .title("\xA76\xA7lSell Inventory")
            .body("Select an item to sell")

        // build buttons for each unique sellable item stack.
        items.forEach(item => {
            form.button(`\xA7e${item.name} \xA77x${item.amount} \xA7a- ${SellStore.formatMoney(item.totalValue)}`)
        })

        system.run(async () => {
            const res = await form.show(player)
            if (res.canceled) return
            // if an item is selected, open the quantity specification dialog.
            if (res.selection >= 0 && res.selection < items.length) {
                showSellDialog(player, items[res.selection])
            }
        })
    } catch (error) {
        console.error(`Browse inventory error: ${error}`)
        player.sendMessage("\xA7c\xA7l» \xA77Failed to open inventory.");
    }
}

// ----------------------------------------------------------------------------
// | function: showSellDialog                                                 |
// | a detailed modal for specifying the exact quantity to liquidate.         |
// ----------------------------------------------------------------------------
function showSellDialog(player, item) {
    const form = new ModalFormData()
        .title(`\xA76\xA7lSell ${item.name}`)
        .textField("Item Name:", item.name)
        .textField("Available:", item.amount.toString())
        .textField("Sell price:", SellStore.formatMoney(item.sellPrice))
        .textField("Total value:", SellStore.formatMoney(item.totalValue))
        .textField("Quantity to sell:", "Enter quantity...")

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        // parse quantity from input field index 4.
        const quantity = parseInt(String(res.formValues[4]))
        if (quantity && quantity > 0) {
            const transaction = SellStore.sellItem(player, item.id, quantity)
                    
            if (transaction.success) {
                player.sendMessage(`\xA7a\xA7l» \xA7f${transaction.message}`);
            } else {
                player.sendMessage(`\xA7c\xA7l» \xA77${transaction.message}`);
            }
        } else {
            player.sendMessage("\xA7c\xA7l» \xA77Invalid quantity.");
        }
    })
}

// ----------------------------------------------------------------------------
// | function: findItem                                                       |
// | search engine for the industrial item catalog.                           |
// ----------------------------------------------------------------------------
function findItem(query) {
    const lowerQuery = query.toLowerCase()
    
    // search by ID first (exact match).
    if (MINECRAFT_ITEMS[`minecraft:${query}`]) {
        return { id: `minecraft:${query}`, ...MINECRAFT_ITEMS[`minecraft:${query}`] }
    }

    // search by fuzzy name match.
    const matches = Object.entries(MINECRAFT_ITEMS)
        .filter(([id, item]) => 
            id.toLowerCase().includes(lowerQuery) || 
            item.name.toLowerCase().includes(lowerQuery)
        )
        .map(([id, item]) => ({ id, ...item }))

    // return the first match or null.
    return matches.length > 0 ? matches[0] : null
}
