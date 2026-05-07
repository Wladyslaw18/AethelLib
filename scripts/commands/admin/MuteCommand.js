/**
 * Mute Command - Silences a player
 */

import { Kernel } from "../../core/Kernel.js"

export const MuteCommand = {
    name: "mute",
    description: "Mute a player's chat",

    parameters: [
        { name: "player", type: "player", optional: false },
        { name: "duration", type: "string", optional: true }
    ],

    async execute(_data, player, args) {
        const target = args[0];
        const durationStr = args[1] || "permanent";

        // Handle failed resolution
        if (typeof target === "string") {
            player.sendMessage(`§c§l» §7Player '${target}' not found.`);
            return;
        }


        const MuteStore = Kernel.get("muteStore");
        if (!MuteStore) {
            player.sendMessage("§c§l» §7Mute system is offline.");
            return;
        }


        try {
            const success = await MuteStore.mute(target, durationStr);
            if (success) {
                const timeLabel = durationStr === "permanent" ? "permanently" : `for ${durationStr}`;
                player.sendMessage(`§a§l» §fPlayer §e${target.name}§f has been muted §e${timeLabel}§f.`);
                target.sendMessage(`§c§l» §7You have been muted §e${timeLabel}§7 by an administrator.`);
            } else {
                player.sendMessage("§c§l» §7Failed to apply mute.");
            }

        } catch (error) {
            player.sendMessage(`§cError: ${error.message}`);
        }
    }
}

