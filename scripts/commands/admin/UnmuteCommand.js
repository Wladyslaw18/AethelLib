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
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:unmute <player>")
            return
        }

        const MuteStore = Kernel.get("muteStore");
        if (!MuteStore) {
            player.sendMessage("\xA7c\xA7l» \xA77Mute system is offline.");
            return;
        }

        try {
            const success = await MuteStore.unmute(target.id)
            if (success) {
                player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully unmuted \xA7e${target.name}\xA7f.`)
                target.sendMessage("\xA7a\xA7l» \xA7fYou have been unmuted by an admin.")
            } else {
                player.sendMessage("\xA7c\xA7l» \xA77Failed to unmute player.")
            }
        } catch (error) {
            player.sendMessage(`\xA7cError unmuting player: ${error.message}`)
        }
    }
}
