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
        .body(`\xA77Account Liquidity: \xA7a$${balance.toLocaleString()}\n\xA78Select category or search for assets.`)
        .button("\xA76\xA7lSEARCH\n\xA78Find specific asset", "textures/ui/magnifying_glass")

    categories.forEach(cat => {
        form.button(`\xA7l${cat.id}\n\xA78Industrial Asset Vector`, cat.icon)
    })

    form.button("\xA7e\xA7lSELL FROM INVENTORY\n\xA78Liquidate held assets", "textures/items/gold_ingot")
    form.button("\xA76\xA7lQUICK SELL\n\xA78Liquidate mainhand asset", "textures/items/paper")
    form.button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

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

