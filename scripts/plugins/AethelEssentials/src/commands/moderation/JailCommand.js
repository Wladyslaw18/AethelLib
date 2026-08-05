import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { JailStore } from "../../systems/stores/JailStore.js";
import { Kernel } from "../../../../../core/Kernel.js";

export const JailCommand = {
    name: "jail",
    description: "Jail a player",
    usage: "/ae:jail <player> [durationMinutes] [reason]",
    permission: "essentials.jail",
    category: "MODERATION",
    native: false,
    params: [
        { name: "player", type: "player", optional: false },
        { name: "duration", type: "number", optional: true },
        { name: "reason", type: "string", optional: true }
    ],
    execute(data, player, args) {
        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args);
        
        if (!target || !target.isValid) {
            player.sendMessage("§c§l» §7Player not found or offline.");
            return;
        }
        
        const loc = JailStore.getJailLocation();
        if (!loc) {
            player.sendMessage("§c§l» §7Jail location is not set. Use /ae:setjail first.");
            return;
        }

        let durationMs = 0;
        let minutes = 0;
        let reason = "No reason provided";

        if (args.length > consumedArgs) {
            const durationArg = args[consumedArgs];
            const parsed = parseFloat(durationArg);
            if (!isNaN(parsed) && Number.isFinite(parsed) && parsed > 0) {
                minutes = parsed;
                durationMs = minutes * 60 * 1000;
                if (args.length > consumedArgs + 1) {
                    reason = args.slice(consumedArgs + 1).join(" ");
                }
            } else {
                reason = args.slice(consumedArgs).join(" ");
            }
        }

        try {
            const rawTarget = target.__rawEntity__ || target;
            JailStore.jailPlayer(rawTarget.id, durationMs, reason, player.name);
            
            const dim = Kernel.world.getDimension(loc.dimension || "overworld");
            if (!dim) {
                player.sendMessage("§c§l» §7Invalid jail dimension.");
                return;
            }
            rawTarget.teleport(loc, { dimension: dim });
            
            const durationText = durationMs > 0 ? `${minutes} minutes` : "permanently";
            
            Kernel.world.sendMessage(`§8[§cJail§8] §f${player.name} §7jailed §f${rawTarget.name} §7for §f${durationText}§7. Reason: §f${reason}`);
            if (rawTarget.isValid) rawTarget.sendMessage(`§c§l» §fYou have been jailed by §c${player.name}§f for: §7${reason}`);
            
        } catch (error) {
            player.sendMessage(`§c§l» §7Failed to jail player: ${error.message}`);
        }
    }
};
