/**
 * Shop Item List UI - Phase 3: Paginated item list with navigation
 */

import { ActionFormData } from "@minecraft/server-ui"
import { ShopStore } from "../../systems/shop/ShopStore.js"

async function showItemList(player, category) {
    try {
        const items = ShopStore.getItemsByCategory(category)
        await showItemListPage(player, items, category, 0)
    } catch (error) {
        console.error(`Shop item list error: ${error}`)
        player.sendMessage("§cFailed to load shop items")
    }
}

export { showItemList as ShopItemListUI }

async function showItemListPage(player, items, category, page) {
    const ITEMS_PER_PAGE = 48
    const startIndex = page * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length)
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)

    const form = new ActionFormData()
        .title(`§6§l${category.charAt(0).toUpperCase() + category.slice(1)} Shop`)
        .body(`§7Page ${page + 1}/${totalPages || 1}`)

    // Add "← Back" button first
    form.button("§c← Back")

    // Add navigation buttons if needed
    if (page > 0) {
        form.button("§7← Prev Page")
    }
    if (page < totalPages - 1) {
        form.button("§7Next Page →")
    }

    // Add item buttons
    for (let i = startIndex; i < endIndex; i++) {
        const item = items[i]
        form.button(`§e${item.displayName} §7- §a${item.price}`)
    }

    const res = await form.show(player)
    if (res.canceled) return

    const buttonIndex = res.selection
    const navOffset = 1 // Back button
    const prevOffset = page > 0 ? 1 : 0
    const nextOffset = page < totalPages - 1 ? 1 : 0

    // Handle Back button
    if (buttonIndex === 0) {
        const { ShopCategoryUI } = await import("./ShopCategoryUI.js")
        await ShopCategoryUI.showCategoryUI(player)
        return
    }

    // Handle Prev Page
    if (page > 0 && buttonIndex === navOffset) {
        await showItemListPage(player, items, category, page - 1)
        return
    }

    // Handle Next Page
    if (page < totalPages - 1 && buttonIndex === navOffset + prevOffset) {
        await showItemListPage(player, items, category, page + 1)
        return
    }

    // Handle item selection
    const itemIndex = buttonIndex - navOffset - prevOffset - nextOffset
    if (itemIndex >= 0 && itemIndex < (endIndex - startIndex)) {
        const item = items[startIndex + itemIndex]
        const { ShopBuyUI } = await import("./ShopBuyUI.js")
        await ShopBuyUI.showBuyFlow(player, item)
    }
}
