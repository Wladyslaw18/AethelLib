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
        .body(`§7Account Liquidity: §a$${balance.toLocaleString()}\n§8Select category or search for assets.`)
        .button("§6§lSEARCH\n§8Find specific asset", "textures/ui/magnifying_glass")

    categories.forEach(cat => {
        form.button(`§l${cat.id}\n§8Industrial Asset Vector`, cat.icon)
    })

    form.button("§e§lSELL FROM INVENTORY\n§8Liquidate held assets", "textures/items/gold_ingot")
    form.button("§6§lQUICK SELL\n§8Liquidate mainhand asset", "textures/items/paper")
    form.button("§c§l[BACK]", "textures/ui/refresh")

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

