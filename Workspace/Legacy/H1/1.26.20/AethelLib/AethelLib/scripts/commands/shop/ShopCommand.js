import { showShopUI } from "../../ui/economy/ShopUI.js"

/*
 * INDUSTRIAL_SHOP_ENTRY_VECTOR
 * ----------------------------------------------------------------------------
 * The primary entry point for the global industrial shop.
 * Orchestrates the handshake with the visual Shop Manifest GUI.
 *
 * PHILOSOPHY: Trade is accessible via the Obsidian Manifest.
 */
export const ShopCommand = {
    name: "shop",
    description: "Invokes the visual Industrial Shop interface for asset acquisition.",
    usage: "/ae:shop",
    permission: "essentials.shop",
    category: "Economy",

    execute(_data, player, _args) {
        showShopUI(player);
    }
}
