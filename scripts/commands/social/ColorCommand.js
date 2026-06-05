import { Kernel } from "../../core/Kernel.js"
import { ColorSystem } from "../../systems/social/chat/ColorSystem.js"

// ----------------------------------------------------------------------------
// | object: ColorCommand                                                     |
// | command definition for customizing the player's visual chat presence.      |
// | routes to either a selection UI or processes a direct color token.       |
// ----------------------------------------------------------------------------
export const ColorCommand = {
    // internal name.
    name: "color",
    // human-readable description.
    description: "Change your chat color",
    // syntax guide.
    usage: "/ae:color [color_token]",
    // required permission level.
    permission: "essentials.chat.color",
    // command category.
    category: "SOCIAL",
    // native parameter definitions to allow color suggestions.
    parameters: [
        { name: "color", type: "chatcolor", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the color calibration vector. handles UI spawning if no args provided,    |
    // | otherwise attempts a direct color set with validation fallback.          |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // the first argument is our color identifier (e.g. "red", "gold").
        const color = args[0]?.toLowerCase()
        
        // case 1: no argument. open the visual color picker.
        if (!color) {
            Kernel.system.run(() => ColorSystem.showColorSelection(player))
            return
        }
        
        // case 2: direct token provided.
        // attempt to update the player's preference in the color service.
        const success = ColorSystem.setPlayerColor(player, color)
        
        if (!success) {
            // if the color token was invalid or not unlocked by the player.
            // resolve the list of currently allowed colors for feedback.
            const availableColors = ColorSystem.getAvailableColors(player)
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Invalid color. Available: \u00A7e${availableColors.join("\u00A77, \u00A7e")}`);
        }
    }
}
