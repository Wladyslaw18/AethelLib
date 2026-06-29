import { showMainGUI } from "../../ui/MainGUI.js"

/*
 * INDUSTRIAL_MENU_ENTRY_VECTOR
 * ----------------------------------------------------------------------------
 * The primary entry-node for the visual navigation nexus.
 */
export const MenuCommand = {
    name: "menu",
    description: "Open the main server menu",

    usage: "/ae:menu",
    permission: "essentials.menu",
    category: "General",

    execute(_data, player, _args) {
        showMainGUI(player);
    }
}
