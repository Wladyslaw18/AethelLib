import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: MuteCommand                                                      |
// | revokes player chat privileges. persits silence in the MuteStore.        |
// | native C++ validation means zero resolution loops or name matching!       |
// ----------------------------------------------------------------------------
export const MuteCommand = {
    name: "mute",
    description: "Mute a player's chat",
    permission: "essentials.admin.mute",

    // NATIVE SCHEMA DEFINITION
    params: [
        { name: "player", type: Kernel.CustomCommandParamType.PlayerSelector, optional: false },
        { name: "duration", type: Kernel.CustomCommandParamType.String, optional: true }
    ],

    async execute(_data, player, args) {
        // target is an actual rich Player object! duration is a C++ validated String!
        const [target, durationStr = "permanent"] = args;

        if (!target) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:mute <player> [duration]");
            return;
        }

        const MuteStore = Kernel.get("muteStore");
        if (!MuteStore) {
            player.sendMessage("\xA7c\xA7l» \xA77Mute system is offline.");
            return;
        }

        try {
            const success = await MuteStore.mute(target, durationStr);
            if (success) {
                const timeLabel = durationStr === "permanent" ? "permanently" : `for ${durationStr}`;
                player.sendMessage(`\xA7a\xA7l» \xA7fPlayer \xA7e${target.name}\xA7f has been muted \xA7e${timeLabel}\xA7f.`);
                target.sendMessage(`\xA7c\xA7l» \xA77You have been muted \xA7e${timeLabel}\xA77 by an administrator.`);
            } else {
                player.sendMessage("\xA7c\xA7l» \xA77Failed to apply mute.");
            }
        } catch (error) {
            player.sendMessage(`\xA7cError: ${error.message}`);
        }
    }
}
