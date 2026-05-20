import { Kernel } from "../../core/Kernel.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { showSearchUI } from "./ShopSearchUI.js"
import { showInventorySellUI } from "./ShopInventoryUI.js"
import { handleQuickSell } from "./ShopTransaction.js"
import { ShopRegistry } from "../../systems/shop/ShopRegistry.js"
// @ts-ignore
import { showCategoryUI } from "./ShopCategoryUI.js"
import { showMainGUI } from "../MainGUI.js"

export async function showShopUI(player) {
    const balance = await EconomyStore.getBalance(player)
    const categories = ShopRegistry.getCategories()
    
    const form = new Kernel.ActionFormData()
        .title(Lang.UI.SHOP_TITLE)
        .body(`\u00A77Account Liquidity: \u00A7a$${balance.toLocaleString()}\n\u00A78Select category or search for assets.`)
        .button("\u00A76\u00A7lSEARCH\n\u00A78Find specific asset", "textures/ui/magnifying_glass")

    categories.forEach(cat => {
        form.button(`\u00A7l${cat.id}\n\u00A78Industrial Asset Vector`, cat.icon)
    })

    form.button("\u00A7e\u00A7lSELL FROM INVENTORY\n\u00A78Liquidate held assets", "textures/items/gold_ingot")
    form.button("\u00A76\u00A7lQUICK SELL\n\u00A78Liquidate mainhand asset", "textures/items/paper")
    form.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    
    const backIndex = 1 + categories.length + 2
    if (res.selection === backIndex) {
        Kernel.system.run(() => showMainGUI(player))
        return
    }

    if (res.selection === 0) {
        Kernel.system.run(() => showSearchUI(player))
        return
    }

    const sellInvIndex = 1 + categories.length
    const quickSellIndex = 1 + categories.length + 1

    if (res.selection === sellInvIndex) {
        Kernel.system.run(() => showInventorySellUI(player))
        return
    }

    if (res.selection === quickSellIndex) {
        Kernel.system.run(() => handleQuickSell(player))
        return
    }

    const selectedCategory = categories[res.selection - 1]
    if (selectedCategory) {
        Kernel.system.run(() => showCategoryUI(player, selectedCategory.id))
    }
}

