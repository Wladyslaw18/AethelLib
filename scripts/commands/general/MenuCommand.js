import { showMainGUI } from "../../ui/MainGUI.js"

// ----------------------------------------------------------------------------
// | object: MenuCommand                                                      |
// | command definition for the primary visual interface.                      |
// | routes the player to the main navigation nexus.                          |
// ----------------------------------------------------------------------------
export const MenuCommand = {
    // internal identifier.
    name: "menu",
    // human-readable description.
    description: "Open the main server menu",
    // syntax guide.
    usage: "/ae:menu",
    // required permission level.
    permission: "essentials.menu",
    // organization category.
    category: "General",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | simple UI entry vector. triggers the MainGUI logic immediately.          |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // no parameters required. open the UI.
        Kernel.system.run(() => showMainGUI(player));
    }
}
