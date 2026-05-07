import { ActionFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
import { ShopStore } from "../../systems/economy/ShopStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { showShopUI } from "./ShopUI.js"
// @ts-ignore
import { showBuyConfirmation } from "./ShopTransaction.js"

/*
 * SHOP_CATEGORY_BROWSER
 */

export async function showCategoryUI(player, category) {
    const items = ShopStore.getByCategory(category)
    const form = new ActionFormData()
        .title(Lang.GOLD + "SHOP: " + category)
        .body(items.length > 0 
            ? `\u00A77Browsing ${items.length} nodes in vector.`
            : "\u00A7cMANIFEST DECOMMISSIONED: No items found in this vector.")
        
    if (items.length > 0) {
        items.forEach(item => {
            form.button(`\u00A7f\u00A7l${item.name.toUpperCase()}\n\u00A7aBuy: $${item.buy} \u00A77| \u00A7cSell: $${item.sell}`, Lang.getTexture(item.id))
        })
    } else {
        form.button("\u00A7e\u00A7lREFRESH MANIFEST", "textures/ui/refresh")
    }

    form.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    
    const backIndex = items.length > 0 ? items.length : 1
    if (res.canceled || res.selection === backIndex) {
        system.run(() => showShopUI(player))
        return
    }

    if (items.length === 0 && res.selection === 0) {
        system.run(() => showCategoryUI(player, category))
        return
    }

    const selected = items[res.selection]
    system.run(() => showBuyConfirmation(player, selected))
}
