import { showShopUI } from "../../ui/economy/ShopUI.js"

// ----------------------------------------------------------------------------
// | object: ShopCommand                                                      |
// | command definition for accessing the global server marketplace.           |
// | simply routes the player to the main shop UI vector.                     |
// ----------------------------------------------------------------------------
export const ShopCommand = {
    // internal name.
    name: "shop",
    // human-readable description.
    description: "Open the server shop menu",
    // syntax guide.
    usage: "/ae:shop",
    // required permission node.
    permission: "essentials.shop",
    // command category.
    category: "Economy",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for the shop command. launches the UI handler immediately.   |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // no arguments needed, just fire and forget the UI logic.
        showShopUI(player);
    }
}
