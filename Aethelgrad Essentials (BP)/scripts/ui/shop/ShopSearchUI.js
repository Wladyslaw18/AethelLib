/**
 * Shop Search UI - Phase 2: Search functionality
 */

import { ActionFormData } from "@minecraft/server-ui"
import { ShopStore } from "../../systems/shop/ShopStore.js"

async function showSearchResults(player, query) {
    try {
        const items = ShopStore.getItems()
        const results = items.filter(item =>
            item.displayName.toLowerCase().includes(query) || 
            item.id.toLowerCase().includes(query)
        )

        await showResultsPage(player, results, query, 0)
    } catch (error) {
        console.error(`Shop search error: ${error}`)
        player.sendMessage("§cFailed to search shop items")
    }
}

export { showSearchResults as ShopSearchUI }

async function showResultsPage(player, results, query, page) {
    const ITEMS_PER_PAGE = 48
    const startIndex = page * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, results.length)
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)

    const form = new ActionFormData()
        .title(`§6§lSearch Results`)
        .body(`§7Query: "${query}" | Page ${page + 1}/${totalPages || 1}`)

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
        const item = results[i]
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
        await showResultsPage(player, results, query, page - 1)
        return
    }

    // Handle Next Page
    if (page < totalPages - 1 && buttonIndex === navOffset + prevOffset) {
        await showResultsPage(player, results, query, page + 1)
        return
    }

    // Handle item selection
    const itemIndex = buttonIndex - navOffset - prevOffset - nextOffset
    if (itemIndex >= 0 && itemIndex < (endIndex - startIndex)) {
        const item = results[startIndex + itemIndex]
        const { ShopBuyUI } = await import("./ShopBuyUI.js")
        await ShopBuyUI.showBuyFlow(player, item)
    }
}
