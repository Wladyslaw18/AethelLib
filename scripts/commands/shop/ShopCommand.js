import { showShopUI } from "../../ui/economy/ShopUI.js"

// ----------------------------------------------------------------------------
// | object: ShopCommand                                                      |
// | command definition for invoking the global visual marketplace.            |
// | acts as a bridge to the ShopUI manifest.                                 |
// ----------------------------------------------------------------------------
export const ShopCommand = {
    // internal name.
    name: "shop",
    // human-readable description.
    description: "Invokes the visual Industrial Shop interface for asset acquisition.",
    // syntax guide.
    usage: "/ae:shop",
    // required permission node.
    permission: "essentials.shop",
    // command category.
    category: "Economy",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for the shop. spawns the visual GUI dashboard.               |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // trigger the visual manifest spawn. 
        // the UI handles the transactional logic and asset display.
        showShopUI(player);
    }
}
