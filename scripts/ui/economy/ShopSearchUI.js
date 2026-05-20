import { Kernel } from "../../core/Kernel.js";
import { ShopStore } from "../../systems/economy/ShopStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { showShopUI } from "./ShopUI.js"
// @ts-ignore
import { showBuyConfirmation } from "./ShopTransaction.js"

/*
 * SHOP_SEARCH_INTERFACE
 */

export async function showSearchUI(player) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GOLD + "SEARCH SHOP")
        .textField("Enter item name:", "e.g. Diamond", "")
    
    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.run(() => showShopUI(player))
        return
    }

    const query = String(res.formValues[0]).toLowerCase()
    const allItems = ShopStore.getItems()
    const results = allItems.filter(i => i.name.toLowerCase().includes(query) || i.id.toLowerCase().includes(query))

    if (results.length === 0) {
        player.sendMessage(Lang.ERROR + "NO ASSETS FOUND: Query returned zero nodes.")
        Kernel.system.run(() => showShopUI(player))
        return
    }

    const resultForm = new Kernel.ActionFormData()
        .title(Lang.GOLD + "RESULTS: " + query.toUpperCase())
        .body(`\u00A77Found ${results.length} matches in manifest.`)

    results.forEach(item => {
        resultForm.button(`\u00A7f\u00A7l${item.name.toUpperCase()}\n\u00A7aBuy: $${item.buy} \u00A77| \u00A7cSell: $${item.sell}`, Lang.getTexture(item.id))
    })
    resultForm.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    const res2 = await UIUtils.showForm(player, resultForm)
    if (res2.canceled || res2.selection === results.length) {
        Kernel.system.run(() => showShopUI(player))
        return
    }

    const selected = results[res2.selection]
    Kernel.system.run(() => showBuyConfirmation(player, selected))
}
