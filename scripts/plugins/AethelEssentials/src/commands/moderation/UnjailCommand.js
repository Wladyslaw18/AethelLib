import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { JailStore } from "../../systems/stores/JailStore.js";
import { Kernel } from "../../../../../core/Kernel.js";

export const UnjailCommand = {
    name: "unjail",
    description: "Unjail a player",
    usage: "/ae:unjail <player>",
    permission: "essentials.unjail",
    category: "MODERATION",
    native: true,
    params: [
        { name: "player", type: "player", optional: false }
    ],
    execute(data, player, args) {
        try {
            const { player: target } = PlayerUtils.resolveFromArgs(args);
            
            if (!target || !target.isValid) {
                player.sendMessage("§c§l» §7Player not found or offline.");
                return;
            }

            const rawTarget = target.__rawEntity__ || target;
            const isJailed = JailStore.isJailed(rawTarget.id);

            if (!isJailed) {
                player.sendMessage(`§c§l» §f${rawTarget.name} §7is not currently jailed.`);
                return;
            }

            JailStore.unjailPlayer(rawTarget.id);
            Kernel.world.sendMessage(`§8[§aUnjail§8] §f${player.name} §7unjailed §f${rawTarget.name}§7.`);
            if (rawTarget.isValid) rawTarget.sendMessage(`§a§l» §fYou have been unjailed.`);
        } catch (err) {
            player.sendMessage(`§c§l» §7Failed to unjail player: ${err.message}`);
        }
    }
};
