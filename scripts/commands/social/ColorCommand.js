import { ColorSystem } from "../../systems/social/chat/ColorSystem.js"

/*
 * INDUSTRIAL_VISUAL_IDENTIFIER_CALIBRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the calibration of entity 
 * communication-colors. Interfaces with the ColorSystem to manage 
 * visual-manifest preferences within the communication-buffer.
 *
 * PHILOSOPHY: Visual status must be calibrated for industrial clarity. 
 * Use this vector to manifest the entity's preferred color-protocol 
 * within the server's communication-manifest.
 */
export const ColorCommand = {
    name: "color",
    description: "Calibrates the entity's preferred communication-color protocol.",
    usage: "!color [color_token]",
    permission: "essentials.chat.color",
    category: "SOCIAL",

    /* 
     * CALIBRATION_EXECUTION_VECTOR
     */
    async execute(data, player, args) {
        const color = args[0]?.toLowerCase()
        
        if (!color) {
            await ColorSystem.showColorSelection(player)
            return
        }
        
        const success = ColorSystem.setPlayerColor(player, color)
        if (!success) {
            const availableColors = ColorSystem.getAvailableColors(player)
            player.sendMessage(`§cERROR: INVALID_COLOR_TOKEN. §7Available protocols: §e${availableColors.join("§7, §e")}`);
        }
    }
}
