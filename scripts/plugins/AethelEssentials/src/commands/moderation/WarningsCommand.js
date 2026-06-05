import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { WarningStore } from "../../systems/stores/WarningStore.js";

export const WarningsCommand = {
    name: "warnings",
    description: "List a player's warnings",
    usage: "/ae:warnings <player>",
    permission: "essentials.warnings",
    category: "MODERATION",
    native: false,
    params: [
        { name: "player", type: "player", optional: false }
    ],
    execute(data, player, args) {
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        
        // Handle offline players by name if needed, but standard is online resolver
        const targetId = target ? target.id : null;
        const targetName = target ? target.name : args[0];

        if (!targetId) {
             player.sendMessage("§c§l» §7Player must be online to check warnings by name in this version.");
             return;
        }
        
        const warnings = WarningStore.getWarnings(targetId);
        
        if (warnings.length === 0) {
            player.sendMessage(`§a§l» §f${targetName} §7has no active warnings.`);
            return;
        }

        player.sendMessage(`§c§l=== ${targetName}'s Warnings (${warnings.length}) ===`);
        warnings.forEach((w, i) => {
            const date = new Date(w.timestamp).toLocaleDateString();
            player.sendMessage(`§e${i + 1}. §8[§7${date}§8] §f${w.reason} §8- §c${w.moderator}`);
        });
    }
};
