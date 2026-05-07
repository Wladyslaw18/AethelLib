import { Kernel } from "../../core/Kernel.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { showSearchUI } from "./ShopSearchUI.js"
import { showInventorySellUI } from "./ShopInventoryUI.js"
import { handleQuickSell } from "./ShopTransaction.js"
// @ts-ignore
import { showCategoryUI } from "./ShopCategoryUI.js"
import { showMainGUI } from "../MainGUI.js"

/*
 * SHOP_MAIN_HUB
 * ----------------------------------------------------------------------------
 * Central navigation for the economy manifest.
 */

export async function showShopUI(player) {
    const balance = await EconomyStore.getBalance(player)
    
    const form = new Kernel.ActionFormData()
        .title(Lang.UI.SHOP_TITLE)
        .body(`\u00A77Account Liquidity: \u00A7a$${balance.toLocaleString()}\n\u00A78Select category or search for assets.`)
        .button("\u00A76\u00A7lSEARCH\n\u00A78Find specific asset", "textures/ui/magnifying_glass")
        .button("\u00A7lEQUIPMENT\n\u00A78Tools, Armor & Weapons", "textures/items/diamond_sword")
        .button("\u00A7lITEMS\n\u00A78General Materials & Assets", "textures/items/iron_ingot")
        .button("\u00A7lCONSTRUCTIONS\n\u00A78Building & Decorative Blocks", "textures/blocks/stone")
        .button("\u00A7lENCHANTS\n\u00A78Arcane Utility Vectors", "textures/items/enchanted_book")
        .button("\u00A7lNATURE\n\u00A78Biological & Organic Assets", "textures/blocks/oak_log")
        .button("\u00A7e\u00A7lSELL FROM INVENTORY\n\u00A78Liquidate held assets", "textures/items/gold_ingot")
        .button("\u00A76\u00A7lQUICK SELL\n\u00A78Liquidate mainhand asset", "textures/items/paper")
        .button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    
    if (res.selection === 8) {
        Kernel.system.run(() => showMainGUI(player))
        return
    }

    switch (res.selection) {
        case 0: 
            console.log("[ShopUI] SEARCH_TRIGGERED");
            player.sendMessage("§e[DEBUG] Triggering Search Vector...");
            Kernel.system.run(() => showSearchUI(player)); 
            break
        case 6: Kernel.system.run(() => showInventorySellUI(player)); break
        case 7: Kernel.system.run(() => handleQuickSell(player)); break
        default: {
            const categories = ["EQUIPMENT", "ITEMS", "CONSTRUCTIONS", "ENCHANTS", "NATURE"]
            Kernel.system.run(() => showCategoryUI(player, categories[res.selection - 1]))
        }
    }
}

