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
            await ColorSystem.showColorSelection(player)
            return
        }
        
        // case 2: direct token provided.
        // attempt to update the player's preference in the color service.
        const success = ColorSystem.setPlayerColor(player, color)
        
        if (!success) {
            // if the color token was invalid or not unlocked by the player.
            // resolve the list of currently allowed colors for feedback.
            const availableColors = ColorSystem.getAvailableColors(player)
            player.sendMessage(`\xA7c\xA7l» \xA77Invalid color. Available: \xA7e${availableColors.join("\xA77, \xA7e")}`);
        }
    }
}
