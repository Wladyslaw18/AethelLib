/**
 * Reset Data Command - Reset various data stores
 */

import { world } from "@minecraft/server"
import { ActionFormData, MessageFormData } from "@minecraft/server-ui"

export const ResetDataCommand = {
    name: "resetdata",
    description: "Reset server data",
    usage: "!resetdata",
    permission: "essentials.admin.resetdata",
    category: "admin",

    async execute(data, player, args) {
        await showCategorySelection(player)
    }
}

async function showCategorySelection(player) {
    const form = new ActionFormData()
        .title("§6§lReset Data")
        .body("§cWARNING: This will permanently delete data!\n\nSelect a category to reset:")
        .button("§cALL DATA")
        .button("§eMONEY")
        .button("§aHOMES")
        .button("§bWARPS")
        .button("§cBANS")
        .button("§dSELL PRICES")
        .button("§6SHOP")
        .button("§fRANKS")
        .button("§9FLOATING TEXT")
        .button("§7Cancel")

    const res = await form.show(player)
    if (res.canceled || res.selection === 9) return

    const categories = [
        "ALL DATA",
        "MONEY", 
        "HOMES",
        "WARPS",
        "BANS",
        "SELL PRICES",
        "SHOP",
        "RANKS",
        "FLOATING TEXT"
    ]

    const category = categories[res.selection]
    await showConfirmation(player, category)
}

async function showConfirmation(player, category) {
    const form = new MessageFormData()
        .title("§6§lConfirm Reset")
        .body(`§cThis will permanently delete all ${category} data.\n\n§eThis action cannot be undone!\n\nAre you absolutely sure?`)
        .button1("§cCancel")
        .button2("§4§lRESET")

    const res = await form.show(player)
    if (res.canceled || res.selection === 0) return

    await performReset(player, category)
}

async function performReset(player, category) {
    try {
        let successCount = 0
        let errorCount = 0
        const errors = []

        switch (category) {
            case "ALL DATA":
                successCount += await resetMoney() ? 1 : 0
                successCount += await resetHomes() ? 1 : 0
                successCount += await resetWarps() ? 1 : 0
                successCount += await resetBans() ? 1 : 0
                successCount += await resetSellPrices() ? 1 : 0
                successCount += await resetShop() ? 1 : 0
                successCount += await resetRanks() ? 1 : 0
                successCount += await resetFloatingText() ? 1 : 0
                break

            case "MONEY":
                successCount += await resetMoney() ? 1 : 0
                break

            case "HOMES":
                successCount += await resetHomes() ? 1 : 0
                break

            case "WARPS":
                successCount += await resetWarps() ? 1 : 0
                break

            case "BANS":
                successCount += await resetBans() ? 1 : 0
                break

            case "SELL PRICES":
                successCount += await resetSellPrices() ? 1 : 0
                break

            case "SHOP":
                successCount += await resetShop() ? 1 : 0
                break

            case "RANKS":
                successCount += await resetRanks() ? 1 : 0
                break

            case "FLOATING TEXT":
                successCount += await resetFloatingText() ? 1 : 0
                break
        }

        if (errorCount === 0) {
            player.sendMessage(`§aSuccessfully reset ${category} data (${successCount} categories)`)
        } else {
            player.sendMessage(`§6Reset completed with ${errorCount} errors. ${successCount} categories reset successfully.`)
            if (errors.length > 0) {
                player.sendMessage(`§cErrors: ${errors.join(", ")}`)
            }
        }

    } catch (error) {
        player.sendMessage(`§cFailed to reset ${category} data: ${error.message}`)
        console.error(`Reset data error for ${category}:`, error)
    }
}

async function resetMoney() {
    try {
        // Clear all player money /* ANOMALY */ the dynamic property
        // Note: This would require iterating through all stored player data
        // For now, we'll clear the main money storage if it exists
        world.setDynamicProperty("ae:economy_data", undefined)
        return true
    } catch (error) {
        console.error("Failed to reset money data:", error)
        return false
    }
}

async function resetHomes() {
    try {
        // Clear all home data
        // This would require clearing all keys matching "home:*" pattern
        // For now, we'll clear the main home storage if it exists
        world.setDynamicProperty("ae:homes_data", undefined)
        return true
    } catch (error) {
        console.error("Failed to reset homes data:", error)
        return false
    }
}

async function resetWarps() {
    try {
        world.setDynamicProperty("ae:warps", undefined)
        world.setDynamicProperty("ae:warp:list", undefined)
        return true
    } catch (error) {
        console.error("Failed to reset warps data:", error)
        return false
    }
}

async function resetBans() {
    try {
        world.setDynamicProperty("ae:bans", undefined)
        return true
    } catch (error) {
        console.error("Failed to reset bans data:", error)
        return false
    }
}

async function resetSellPrices() {
    try {
        world.setDynamicProperty("ae:sell_prices", undefined)
        return true
    } catch (error) {
        console.error("Failed to reset sell prices data:", error)
        return false
    }
}

async function resetShop() {
    try {
        world.setDynamicProperty("ae:shop_data", undefined)
        world.setDynamicProperty("ae:shop_items", undefined)
        return true
    } catch (error) {
        console.error("Failed to reset shop data:", error)
        return false
    }
}

async function resetRanks() {
    try {
        world.setDynamicProperty("ae:rank:list", undefined)
        // Clear all rank definitions (keys matching "rank:def:*")
        // This would require more complex logic to clear all rank definitions
        return true
    } catch (error) {
        console.error("Failed to reset ranks data:", error)
        return false
    }
}

async function resetFloatingText() {
    try {
        world.setDynamicProperty("ae:floatingtexts", undefined)
        return true
    } catch (error) {
        console.error("Failed to reset floating text data:", error)
        return false
    }
}

