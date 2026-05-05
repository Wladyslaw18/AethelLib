import { showCategoryUI } from "./ShopCategoryUI.js"

/*
 * COMMERCE_INTERFACE_ENTRY_VECTOR
 * ----------------------------------------------------------------------------
 * The primary entry point for the industrial shop system. Redirects the 
 * entity to the category-manifest orchestration layer.
 *
 * PHILOSOPHY: Commerce is the lifeblood of the empire. Use this vector 
 * to initiate liquidity-exchange protocols.
 */
export async function showShopUI(player) {
    await showCategoryUI(player)
}
