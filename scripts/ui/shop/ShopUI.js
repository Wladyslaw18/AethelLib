/**
 * Shop UI - Main entry point for the new shop system
 */

import { showCategoryUI } from "./ShopCategoryUI.js"

export async function showShopUI(player) {
    await showCategoryUI(player)
}

