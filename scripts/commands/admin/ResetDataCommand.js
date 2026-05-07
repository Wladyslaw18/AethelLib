import { world } from "@minecraft/server"
import { ActionFormData, MessageFormData } from "@minecraft/server-ui"

/*
 * Data Reset Command
 * ----------------------------------------------------------------------------
 * Allows admins to reset server data and databases.
 */

export const ResetDataCommand = {
    name: "resetdata",
    description: "Reset server data and databases",

    usage: "/ae:resetdata",
    permission: "essentials.admin.resetdata",
    category: "Admin",

    /* 
     * UI_ENTRY_PIPELINE
     */
    async execute(_data, player, _args) {
        player.sendMessage("§c§l» §fReset System Activated.");
        await showCategorySelection(player)
    }

}

/* 
 * CATEGORY_SELECTION_ENGINE
 */
async function showCategorySelection(player) {
    const form = new ActionFormData()
        .title("§6§lReset Data")
        .body("§cWARNING: This action will permanently delete server data!\n\nSelect which data to reset:")
        .button("§c[ RESET ALL DATA ]")
        .button("§eMoney & Balances")
        .button("§aPlayer Homes")
        .button("§bServer Warps")
        .button("§cBan List")
        .button("§dSell Prices")
        .button("§6Shop Data")
        .button("§fRank Data")
        .button("§9Floating Texts")
        .button("§7Cancel")


    const res = await form.show(player)
    if (res.canceled || res.selection === 9) return

    const categories = [
        "TOTAL_PURGE",
        "MONEY", 
        "HOMES",
        "WARPS",
        "BANS",
        "SELL_PRICES",
        "SHOP",
        "RANKS",
        "FLOATING_TEXT"
    ]

    const category = categories[res.selection]
    await showConfirmation(player, category)
}

/* 
 * TERMINATION_CONFIRMATION_GATE
 */
async function showConfirmation(player, category) {
    const form = new MessageFormData()
        .title("§6§lConfirm Reset")
        .body(`§cTarget: ${category}.\n\n§eThis action cannot be undone!\n\nAre you absolutely sure?`)
        .button1("§7Cancel")
        .button2("§c§lRESET DATA")


    const res = await form.show(player)
    if (res.canceled || res.selection === 0) return

    await performReset(player, category)
}

/* 
 * RESET_EXECUTION_ENGINE
 */
async function performReset(player, category) {
    try {
        let successCount = 0
        let errorCount = 0

        const runReset = async (fn) => {
            const success = await fn()
            if (success) successCount++
            else errorCount++
        }

        switch (category) {
            case "TOTAL_PURGE":
                await runReset(resetMoney)
                await runReset(resetHomes)
                await runReset(resetWarps)
                await runReset(resetBans)
                await runReset(resetSellPrices)
                await runReset(resetShop)
                await runReset(resetRanks)
                await runReset(resetFloatingText)
                break

            case "MONEY":
                await runReset(resetMoney)
                break

            case "HOMES":
                await runReset(resetHomes)
                break

            case "WARPS":
                await runReset(resetWarps)
                break

            case "BANS":
                await runReset(resetBans)
                break

            case "SELL_PRICES":
                await runReset(resetSellPrices)
                break

            case "SHOP":
                await runReset(resetShop)
                break

            case "RANKS":
                await runReset(resetRanks)
                break

            case "FLOATING_TEXT":
                await runReset(resetFloatingText)
                break
        }

        if (errorCount === 0) {
            player.sendMessage(`§a§l» §fData for §e${category}§f has been reset.`);
        } else {
            player.sendMessage(`§e§l» §7Reset complete with some errors.`);
        }

    } catch (error) {
        player.sendMessage(`§c§l» §7Failed to reset data: ${error.message}`);
        console.error(`[ResetDataCommand] CRASH for ${category}:`, error)
    }

}

/* 
 * SUB-SYSTEM_PURGE_VECTORS
 */
async function resetMoney() {
    try {
        world.setDynamicProperty("ae:economy_data", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetHomes() {
    try {
        world.setDynamicProperty("ae:homes_data", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetWarps() {
    try {
        world.setDynamicProperty("ae:warps", undefined)
        world.setDynamicProperty("ae:warp:list", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetBans() {
    try {
        world.setDynamicProperty("ae:bans", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetSellPrices() {
    try {
        world.setDynamicProperty("ae:sell_prices", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetShop() {
    try {
        world.setDynamicProperty("ae:shop_data", undefined)
        world.setDynamicProperty("ae:shop_items", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetRanks() {
    try {
        world.setDynamicProperty("ae:rank:list", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetFloatingText() {
    try {
        world.setDynamicProperty("ae:floatingtexts", undefined)
        return true
    } catch (error) {
        return false
    }
}
