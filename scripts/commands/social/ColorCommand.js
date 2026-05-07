import { ColorSystem } from "../../systems/social/chat/ColorSystem.js"

/*
 * Color Command
 * ----------------------------------------------------------------------------
 * Allows players to change their chat name color.
 */

export const ColorCommand = {
    name: "color",
    description: "Change your chat color",

    usage: "/ae:color [color_token]",
    permission: "essentials.chat.color",
    category: "SOCIAL",

    /* 
     * CALIBRATION_EXECUTION_VECTOR
     */
    async execute(_data, player, args) {
        const color = args[0]?.toLowerCase()
        
        if (!color) {
            await ColorSystem.showColorSelection(player)
            return
        }
        
        const success = ColorSystem.setPlayerColor(player, color)
        if (!success) {
            const availableColors = ColorSystem.getAvailableColors(player)
            player.sendMessage(`§c§l» §7Invalid color. Available: §e${availableColors.join("§7, §e")}`);
        }

    }
}
