/**
 * Shop Category UI - Phase 1: Category selection screen
 */

import { ActionFormData } from "@minecraft/server-ui"

export async function showCategoryUI(player) {
    const form = new ActionFormData()
        .title("§6§lShop")
        .body("Select a category")
        .button("⚔ Weapons")
        .button("🛡 Armor") 
        .button("⛏ Tools")
        .button("🍖 Food")
        .button("🧱 Blocks")
        .button("✨ Enchants")
        .button("🔍 Search All")

    const res = await form.show(player)
    if (res.canceled) return

    const categories = ["weapons", "armor", "tools", "food", "blocks", "enchants"]
    
    if (res.selection === 6) {
        // Search All selected
        await showSearchUI(player)
    } else if (res.selection < categories.length) {
        // Category selected
        await showItemListUI(player, categories[res.selection])
    }
}

export async function showSearchUI(player) {
    const { ModalFormData } = await import("@minecraft/server-ui")
    const { ShopSearchUI } = await import("./ShopSearchUI.js")
    
    const modal = new ModalFormData()
        .title("§6Search Shop")
        .textField("Item name", "e.g. diamond...")

    const res = await modal.show(player)
    if (res.canceled) return

    const query = res.formValues[0]?.toLowerCase()
    await ShopSearchUI.showSearchResults(player, query)
}

export async function showItemListUI(player, category) {
    const { ShopItemListUI } = await import("./ShopItemListUI.js")
    await ShopItemListUI.showItemList(player, category)
}
