import { showMainGUI } from "../../ui/MainGUI.js"

/*
 * GUI_INJECTION_VECTOR
 * ----------------------------------------------------------------------------
 * A high-performance manual trigger for the primary navigation interface. 
 * Invokes the MainGUI protocol to present a visual abstraction layer 
 * over the command ecosystem.
 *
 * PHILOSOPHY: For those who prefer buttons over CLI tokens.
 */
export const MenuCommand = {
    name: "menu",
    description: "Invokes the primary industrial navigation interface.",
    usage: "!menu",
    permission: "essentials.menu",
    category: "General",
    aliases: ["m", "gui"],

    /* 
     * INTERFACE_TRIGGER_ENTRY
     */
    execute(_data, player, _args) {
        showMainGUI(player)
    }
}
