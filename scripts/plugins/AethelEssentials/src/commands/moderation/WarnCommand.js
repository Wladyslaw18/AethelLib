import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { WarningStore } from "../../systems/stores/WarningStore.js";
import { PermissionManagerInstance } from "../../../../../core/permissions/PermissionManager.js";

export const WarnCommand = {
    name: "warn",
    description: "Issue a warning to a player",
    usage: "/ae:warn <player> <reason>",
    permission: "essentials.warn",
    category: "MODERATION",
    native: false,
    params: [
        { name: "player", type: "player", optional: false },
        { name: "reason", type: "string", optional: true }
    ],
    execute(data, player, args) {
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        
        if (!target) {
            player.sendMessage("§c§l» §7Player not found.");
            return;
        }
        
        if (!PermissionManagerInstance.canActOn(player, target)) {
            player.sendMessage("§c§l» §7You cannot warn this player.");
            return;
        }

        const reason = args.slice(1).join(" ") || "No reason provided";
        WarningStore.addWarning(target.id, reason, player.name);
        
        const count = WarningStore.getWarningCount(target.id);
        
        // Broadcast to admins
        const world = this.context.world;
        world.sendMessage(`§8[§cWarn§8] §f${player.name} §7warned §f${target.name} §8(§7${count} warns§8) §7for: §f${reason}`);
        
        // Notify the target
        target.sendMessage(`§c§l» §fYou have been warned by §c${player.name}§f for: §7${reason}`);
        
        // Check thresholds
        if (count >= 3 && count < 5) {
            // Mute logic could be imported from MuteStore
            player.sendMessage(`§c§l» §7[Auto-Mod] ${target.name} should be muted (threshold 3).`);
        } else if (count >= 5) {
            // Ban logic could be imported from BanManager
            player.sendMessage(`§c§l» §7[Auto-Mod] ${target.name} should be banned (threshold 5).`);
        }
    }
};
