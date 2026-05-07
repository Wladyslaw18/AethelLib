import { showShopUI } from "../../ui/economy/ShopUI.js"

/*
 * Shop Command
 * ----------------------------------------------------------------------------
 * Allows players to open the server shop.
 */

export const ShopCommand = {
    name: "shop",
    description: "Open the server shop menu",

    usage: "/ae:shop",
    permission: "essentials.shop",
    category: "Economy",

    execute(_data, player, _args) {
        showShopUI(player);
    }
}
