import { Kernel } from "../../core/Kernel.js";
import { ShopStore } from "../../systems/shop/ShopStore.js"
import { UIUtils } from "../UIUtils.js"

/*
 * COMMERCE_ASSET_LIST_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the visual manifestation of 
 * paginated asset manifests. Performs a query of the ShopStore and 
 * constructs a navigation-buffer for the entity.
 *
 * PHILOSOPHY: Assets are industrial components. Use this interface to 
 * identify and select components for acquisition.
 */
async function showItemList(player, category) {
    try {
        const result = ShopStore.getShopItems(category, null, 1, 1000)
        const items = result.items
        await showItemListPage(player, items, category, 0)
    } catch (error) {
        console.error(`[ShopItemListUI] MANIFEST_LOAD_FAILURE: ${error}`)
        player.sendMessage("\u00A7cINDUSTRIAL_INTERFACE_FAILURE: UNABLE_TO_LOAD_MANIFEST")
    }
}

export { showItemList }

/* 
 * PAGINATED_ASSET_BUFFER_MANIFEST
 */
async function showItemListPage(player, items, category, page) {
    const ITEMS_PER_PAGE = 48
    const startIndex = page * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length)
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)

    const form = new Kernel.ActionFormData()
        .title(`\u00A76\u00A7lMODULE: ${category.toUpperCase()}`)
        .body(`\u00A77Page: ${page + 1}/${totalPages || 1}\n\u00A77Active_Assets: ${items.length}`)

    form.button("\u00A7c[RETURN_TO_MANIFEST_ROOT]")

    if (page > 0) {
        form.button("\u00A77← [PREVIOUS_BUFFER]")
    }
    if (page < totalPages - 1) {
        form.button("\u00A77[NEXT_BUFFER] →")
    }

    for (let i = startIndex; i < endIndex; i++) {
        const item = items[i]
        form.button(`\u00A7e${item.name}\n\u00A77CREDITS: \u00A7a${item.price}`)
    }

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    const buttonIndex = res.selection
    const navOffset = 1 
    const prevOffset = page > 0 ? 1 : 0
    const nextOffset = page < totalPages - 1 ? 1 : 0

    if (buttonIndex === 0) {
        const { showCategoryUI } = await import("./ShopCategoryUI.js")
        await showCategoryUI(player)
        return
    }

    if (page > 0 && buttonIndex === navOffset) {
        await showItemListPage(player, items, category, page - 1)
        return
    }

    if (page < totalPages - 1 && buttonIndex === navOffset + prevOffset) {
        await showItemListPage(player, items, category, page + 1)
        return
    }

    const itemIndex = buttonIndex - navOffset - prevOffset - nextOffset
    if (itemIndex >= 0 && itemIndex < (endIndex - startIndex)) {
        const item = items[startIndex + itemIndex]
        const { showBuyFlow } = await import("./ShopBuyUI.js")
        await showBuyFlow(player, item)
    }
}
