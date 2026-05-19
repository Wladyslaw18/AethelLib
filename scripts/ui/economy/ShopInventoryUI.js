import { Kernel } from "../../core/Kernel.js";
import { ShopStore } from "../../systems/economy/ShopStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { showShopUI } from "./ShopUI.js"
import { showSellConfirmation } from "./ShopTransaction.js"

/*
 * SHOP_INVENTORY_LIQUIDATION_UI
 */

export async function showInventorySellUI(player) {
    const inv = player.getComponent(Kernel.EntityComponentTypes.Inventory).container
    const tradableItems = []
    const shopItems = ShopStore.getItems()

    for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i)
        if (!item) continue
        const shopItem = shopItems.find(si => si.id === item.typeId)
        if (shopItem) {
            tradableItems.push({ ...shopItem, amount: item.amount })
        }
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.GOLD + "LIQUIDATION")
        .body(`\xA77Found ${tradableItems.length} tradable asset types in storage.`)

    tradableItems.forEach(item => {
        form.button(`\xA7f\xA7l${item.name.toUpperCase()} \xA77x${item.amount}\n\xA7cValue: $${item.sell * item.amount}`, Lang.getTexture(item.id))
    })
    form.button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === tradableItems.length) {
        Kernel.system.run(() => showShopUI(player))
        return
    }

    const selected = tradableItems[res.selection]
    Kernel.system.run(() => showSellConfirmation(player, selected))
}
