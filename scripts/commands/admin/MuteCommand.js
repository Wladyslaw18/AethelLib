import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: MuteCommand                                                      |
// | revokes player chat privileges. persits silence in the MuteStore.        |
// | native C++ validation means zero resolution loops or name matching!       |
// ----------------------------------------------------------------------------
export const MuteCommand = {
    name: "mute",
    description: "Mute a player's chat",
    usage: "/ae:mute <player> [duration]",
    permission: "essentials.admin.mute",
    category: "Admin",
    // Intercepted by script for complex string handling.
    native: false,

    // NATIVE SCHEMA DEFINITION
    params: [
        { name: "player", type: "player", optional: false },
        { name: "duration", type: "string", optional: true }
    ],

    async execute(_data, player, args) {
        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args);
        const durationStr = args[consumedArgs] || "permanent";

        if (!target) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:mute <player> [duration]");
            return;
        }

        const MuteStore = Kernel.get("muteStore");
        if (!MuteStore) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Mute system is offline.");
            return;
        }

        try {
            const success = await MuteStore.mute(target, durationStr);
            if (success) {
                const timeLabel = durationStr === "permanent" ? "permanently" : `for ${durationStr}`;
                player.sendMessage(`\u00A7a\u00A7l» \u00A7fPlayer \u00A7e${target.name}\u00A7f has been muted \u00A7e${timeLabel}\u00A7f.`);
                target.sendMessage(`\u00A7c\u00A7l» \u00A77You have been muted \u00A7e${timeLabel}\u00A77 by an administrator.`);
            } else {
                player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to apply mute.");
            }
        } catch (error) {
            player.sendMessage(`\u00A7cError: ${error.message}`);
        }
    }
}
