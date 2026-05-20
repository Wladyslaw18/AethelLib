import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: UnmuteCommand                                                    |
// | restores a player's chat privileges.                                     |
// | native C++ validation. direct execution without resolution boilerplates!  |
// ----------------------------------------------------------------------------
export const UnmuteCommand = {
    name: "unmute",
    description: "Unmute a player's chat",
    usage: "/ae:unmute <player>",
    permission: "essentials.admin.mute",
    category: "admin",
    
    // NATIVE SCHEMA DEFINITION
    params: [
        { name: "player", type: Kernel.CustomCommandParamType.PlayerSelector, optional: false }
    ],

    async execute(_data, player, args) {
        // target is an actual rich Player object! C++ is pure wizardry.
        const [target] = args;

        if (!target) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:unmute <player>")
            return
        }

        const MuteStore = Kernel.get("muteStore");
        if (!MuteStore) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Mute system is offline.");
            return;
        }

        try {
            const success = await MuteStore.unmute(target.id)
            if (success) {
                player.sendMessage(`\u00A7a\u00A7l» \u00A7fSuccessfully unmuted \u00A7e${target.name}\u00A7f.`)
                target.sendMessage("\u00A7a\u00A7l» \u00A7fYou have been unmuted by an admin.")
            } else {
                player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to unmute player.")
            }
        } catch (error) {
            player.sendMessage(`\u00A7cError unmuting player: ${error.message}`)
        }
    }
}
