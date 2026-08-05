import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { WarningStore } from "../../systems/stores/WarningStore.js";
import { Kernel } from "../../../../../core/Kernel.js";

export const WarnCommand = {
    name: "warn",
    description: "Issue a warning to a player",
    usage: "/ae:warn <player> [reason]",
    permission: "essentials.warn",
    category: "MODERATION",
    native: false,
    params: [
        { name: "player", type: "player", optional: false },
        { name: "reason", type: "string", optional: true }
    ],
    execute(data, player, args) {
        try {
            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args);
            
            if (!target || !target.isValid) {
                player.sendMessage("§c§l» §7Player not found or offline.");
                return;
            }

            const rawTarget = target.__rawEntity__ || target;
            const reason = args.slice(consumedArgs).join(" ") || "No reason provided";

            WarningStore.addWarning(rawTarget.id, reason, player.name);
            const count = WarningStore.getWarningCount(rawTarget.id);

            Kernel.world.sendMessage(`§8[§cWarn§8] §f${player.name} §7warned §f${rawTarget.name} §8(§7${count} warns§8) §7for: §f${reason}`);
            if (rawTarget.isValid) rawTarget.sendMessage(`§c§l» §fYou received a warning from §c${player.name}§f: §7${reason}`);
        } catch (err) {
            player.sendMessage(`§c§l» §7Warn command error: ${err.message}`);
        }
    }
};
