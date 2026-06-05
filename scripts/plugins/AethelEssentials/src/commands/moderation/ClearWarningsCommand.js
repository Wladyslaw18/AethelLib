import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { WarningStore } from "../../systems/stores/WarningStore.js";

export const ClearWarningsCommand = {
    name: "clearwarnings",
    description: "Clear a player's warnings",
    usage: "/ae:clearwarnings <player>",
    permission: "essentials.clearwarnings",
    category: "MODERATION",
    native: false,
    params: [
        { name: "player", type: "player", optional: false }
    ],
    execute(data, player, args) {
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        
        if (!target) {
            player.sendMessage("§c§l» §7Player not found.");
            return;
        }

        const success = WarningStore.clearWarnings(target.id);
        
        if (success) {
            player.sendMessage(`§a§l» §7Cleared all warnings for §f${target.name}§7.`);
            target.sendMessage(`§a§l» §7Your warnings have been cleared by §f${player.name}§7.`);
        } else {
            player.sendMessage("§c§l» §7Failed to clear warnings.");
        }
    }
};
