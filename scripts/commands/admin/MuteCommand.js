import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: MuteCommand                                                      |
// | command definition for revoking a player's chat privileges.               |
// | interfaces with the MuteStore to persist the silence state.               |
// ----------------------------------------------------------------------------
export const MuteCommand = {
    // internal name.
    name: "mute",
    // human-readable description.
    description: "Mute a player's chat",
    // required permission node.
    permission: "essentials.admin.mute",

    // native parameter definitions for the command parser.
    parameters: [
        { name: "player", type: "player", optional: false },
        { name: "duration", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the entry point when an admin runs the command.                          |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // basic syntax check.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:mute <player> [duration]");
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Duration examples: 1h, 1d, permanent");
            return;
        }

        // resolve the target player object.
        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args);
        // the first argument after the player name is the duration. default to permanent.
        const durationStr = args.slice(consumedArgs)[0] || "permanent";

        // check if the target is actually online. 
        // (currently our mute system relies on the player object being valid during the call).
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${args[0]}' not found or is offline.`);
            return;
        }

        // get the mute service from the kernel.
        const MuteStore = Kernel.get("muteStore");
        if (!MuteStore) {
            player.sendMessage("\xA7c\xA7l» \xA77Mute system is offline.");
            return;
        }

        try {
            // attempt to apply the mute record.
            const success = await MuteStore.mute(target, durationStr);
            if (success) {
                // format the confirmation message based on the duration type.
                const timeLabel = durationStr === "permanent" ? "permanently" : `for ${durationStr}`;
                player.sendMessage(`\xA7a\xA7l» \xA7fPlayer \xA7e${target.name}\xA7f has been muted \xA7e${timeLabel}\xA7f.`);
                // notify the target that they can no longer talk.
                target.sendMessage(`\xA7c\xA7l» \xA77You have been muted \xA7e${timeLabel}\xA77 by an administrator.`);
            } else {
                // if the store rejected the request (e.g. malformed duration).
                player.sendMessage("\xA7c\xA7l» \xA77Failed to apply mute.");
            }

        } catch (error) {
            // catch any unexpected crashes.
            player.sendMessage(`\xA7cError: ${error.message}`);
        }
    }
}
