import { ActionFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
import { ShopRegistry } from "../../systems/shop/ShopRegistry.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { showShopUI } from "./ShopUI.js"
// @ts-ignore
import { showBuyConfirmation } from "./ShopTransaction.js"

export async function showCategoryUI(player, category) {
    const items = await ShopRegistry.getAssetsByCategory(category)
    const form = new ActionFormData()
        .title(Lang.GOLD + "SHOP: " + category)
        .body(items.length > 0 
            ? `§7Browsing ${items.length} nodes in vector.`
            : "§cMANIFEST DECOMMISSIONED: No items found in this vector.")
        
    if (items.length > 0) {
        // Sort items by priority (Industrial Catalog Optimization)
        const sortedItems = [...items].sort((a, b) => (a.priority || 99) - (b.priority || 99))
        
        sortedItems.forEach(item => {
            const id = item.itemId || "minecraft:stone"
            form.button(`§f§l${item.name}\n§aPrice: $${item.price.toLocaleString()}`, Lang.getTexture(id))
        })
    } else {
        form.button("§e§lREFRESH MANIFEST", "textures/ui/refresh")
    }

    form.button("§c§l[BACK]", "textures/ui/refresh")

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
    system.run(() => showBuyConfirmation(player, { ...selected, id: selected.itemId }))
}
