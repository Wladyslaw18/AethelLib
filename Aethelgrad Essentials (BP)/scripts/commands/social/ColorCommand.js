/**
 * Color Command - Change chat color with permission support
 */

import { ColorSystem } from "../../systems/social/chat/ColorSystem.js"

export const ColorCommand = {
    name: "color",
    description: "Change your chat color",
    usage: "!color [color]",
    permission: "essentials.chat.color",
    category: "social",

    async execute(data, player, args) {
        const color = args[0]?.toLowerCase()
        
        if (!color) {
            await ColorSystem.showColorSelection(player)
            return
        }
        
        const success = ColorSystem.setPlayerColor(player, color)
        if (!success) {
            // Show available colors
            const availableColors = ColorSystem.getAvailableColors(player)
            player.sendMessage(`§7Available colors: §e${availableColors.join("§7, §e")}`)
        }
    }
}
