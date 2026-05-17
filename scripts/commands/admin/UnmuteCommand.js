import { MuteStore } from "../../systems/social/MuteStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: UnmuteCommand                                                    |
// | command definition for restoring a player's chat privileges.              |
// ----------------------------------------------------------------------------
export const UnmuteCommand = {
    // internal name.
    name: "unmute",
    // human-readable description.
    description: "Unmute a player's chat",
    // syntax guide.
    usage: "/ae:unmute <playerName>",
    // required permission level.
    permission: "essentials.admin.mute",
    // organization category.
    category: "admin",
    
    // native parameter definitions.
    parameters: [
        { name: "player", type: "player", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | restores chat access for the specified target.                           |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax check.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:unmute <playerName>")
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Type a player name to unmute them.")
            return
        }

        // resolve the target player.
        const playerName = args.join(" ")
        const target = PlayerUtils.findPlayer(playerName)
        
        // ensure the target is online (the system needs their id to clear the record).
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${playerName}' not found or not online.`)
            return
        }

        try {
            // call the mute service to purge the restriction record.
            const success = await MuteStore.unmute(target.id)
            if (success) {
                // notify the admin and the player.
                player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully unmuted \xA7e${target.name}\xA7f.`)
                target.sendMessage("\xA7a\xA7l» \xA7fYou have been unmuted by an admin.")
            } else {
                // if the unmute failed (usually means they weren't muted in the first place).
                player.sendMessage("\xA7c\xA7l» \xA77Failed to unmute player.")
            }

        } catch (error) {
            // catch unexpected errors.
            player.sendMessage(`\xA7cError unmuting player: ${error.message}`)
        }
    }
}
