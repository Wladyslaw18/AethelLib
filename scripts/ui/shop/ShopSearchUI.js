import { Kernel } from "../../core/Kernel.js";
import { ShopStore } from "../../systems/shop/ShopStore.js"

/*
 * COMMERCE_QUERY_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for manifesting the results of 
 * a global asset-query. Performs an O(N) scan of the industrial commerce 
 * manifest and constructs a navigation-buffer for the entity.
 *
 * PHILOSOPHY: Information is power. Use this interface to identify 
 * specific assets within the global trade-registry.
 */
async function showSearchResults(player, query) {
    try {
        const result = ShopStore.getShopItems(null, null, 1, 1000)
        const items = result.items
        const results = items.filter(item =>
            item.name.toLowerCase().includes(query) || 
            item.id.toLowerCase().includes(query)
        )

        await showResultsPage(player, results, query, 0)
    } catch (error) {
        console.error(`[ShopSearchUI] QUERY_FAILURE: ${error}`)
        player.sendMessage("\xA7cINDUSTRIAL_INTERFACE_FAILURE: UNABLE_TO_EXECUTE_QUERY")
    }
}

export { showSearchResults }

/* 
 * PAGINATED_QUERY_RESULT_MANIFEST
 */
async function showResultsPage(player, results, query, page) {
    const ITEMS_PER_PAGE = 48
    const startIndex = page * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, results.length)
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)

    const form = new Kernel.ActionFormData()
        .title("\xA76\xA7lQUERY_RESULTS")
        .body(`\xA77Query: "${query}"\n\xA77Page: ${page + 1}/${totalPages || 1}\n\xA77Matches: ${results.length}`)

    form.button("\xA7c[RETURN_TO_MANIFEST_ROOT]")

    if (page > 0) {
        form.button("\xA77← [PREVIOUS_BUFFER]")
    }
    if (page < totalPages - 1) {
        form.button("\xA77[NEXT_BUFFER] →")
    }

    for (let i = startIndex; i < endIndex; i++) {
        const item = results[i]
        form.button(`\xA7e${item.name}\n\xA77CREDITS: \xA7a${item.price}`)
    }

    const res = await form.show(player)
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
        await showResultsPage(player, results, query, page - 1)
        return
    }

    if (page < totalPages - 1 && buttonIndex === navOffset + prevOffset) {
        await showResultsPage(player, results, query, page + 1)
        return
    }

    const itemIndex = buttonIndex - navOffset - prevOffset - nextOffset
    if (itemIndex >= 0 && itemIndex < (endIndex - startIndex)) {
        const item = results[startIndex + itemIndex]
        const { showBuyFlow } = await import("./ShopBuyUI.js")
        await showBuyFlow(player, item)
    }
}
