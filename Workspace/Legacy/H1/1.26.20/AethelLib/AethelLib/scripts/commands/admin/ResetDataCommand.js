import { world } from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { UIUtils } from "../../ui/UIUtils.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"

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
        const categories = [
            "ALL DATA", 
            "MONEY DATA", 
            "HOME DATA", 
            "WARP DATA", 
            "BAN DATA", 
            "SETTING DATA", 
            "SHOP DATA", 
            "SELL DATA", 
            "RANK DATA", 
            "FLOATINGTEXT DATA"
        ]

        const form = new ModalFormData()
            .title("§c§lRESET DATA")
            .dropdown("Choose data that you want to reset :", categories)

        const res = await UIUtils.showForm(player, form)
        
        if (res.canceled) {
            return player.sendMessage("§c§l» §7Reset data canceled.")
        }

        const selection = categories[res.formValues[0]]
        await this.performReset(player, selection)
    },

    async performReset(player, category) {
        try {
            let successCount = 0
            let errorCount = 0

            const runReset = async (fn) => {
                const success = await fn()
                if (success) successCount++
                else errorCount++
            }

            switch (category) {
                case "ALL DATA":
                    await runReset(resetMoney)
                    await runReset(resetHomes)
                    await runReset(resetWarps)
                    await runReset(resetBans)
                    await runReset(resetSellPrices)
                    await runReset(resetShop)
                    await runReset(resetRanks)
                    await runReset(resetFloatingText)
                    break

                case "MONEY DATA":
                    await runReset(resetMoney)
                    break

                case "HOME DATA":
                    await runReset(resetHomes)
                    break

                case "WARP DATA":
                    await runReset(resetWarps)
                    break

                case "BAN DATA":
                    await runReset(resetBans)
                    break

                case "SETTING DATA":
                    // Reset SettingsStore to defaults
                    SettingsStore.updateAll(SettingsStore.DEFAULT_SETTINGS)
                    successCount++
                    break

                case "SHOP DATA":
                    await runReset(resetShop)
                    break

                case "SELL DATA":
                    await runReset(resetSellPrices)
                    break

                case "RANK DATA":
                    await runReset(resetRanks)
                    break

                case "FLOATINGTEXT DATA":
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
        }
    }
}

/* 
 * SUB-SYSTEM_PURGE_VECTORS
 */
async function resetMoney() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:economy_data")
        return true
    } catch (error) {
        return false
    }
}

async function resetHomes() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:homes_data")
        return true
    } catch (error) {
        return false
    }
}

async function resetWarps() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:warps")
        Database.delete("ae:warp:list")
        return true
    } catch (error) {
        return false
    }
}

async function resetBans() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:bans")
        return true
    } catch (error) {
        return false
    }
}

async function resetSellPrices() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:sell_prices")
        return true
    } catch (error) {
        return false
    }
}

async function resetShop() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:shop_data")
        Database.delete("ae:shop_items")
        return true
    } catch (error) {
        return false
    }
}

async function resetRanks() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:rank:list")
        return true
    } catch (error) {
        return false
    }
}

async function resetFloatingText() {
    try {
        const Database = Kernel.get("database")
        Database.delete("ae:floatingtexts")
        return true
    } catch (error) {
        return false
    }
}
