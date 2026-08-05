import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { FreezeTracker } from "../../systems/stores/FreezeTracker.js";
import { Kernel } from "../../../../../core/Kernel.js";

export const FreezeCommand = {
    name: "freeze",
    description: "Freeze a player in place",
    usage: "/ae:freeze <player>",
    permission: "essentials.freeze",
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
            const isFrozen = FreezeTracker.isFrozen(rawTarget.id);

            if (isFrozen) {
                FreezeTracker.unfreezePlayer(rawTarget.id);
                if (rawTarget.inputPermissions) {
                    rawTarget.inputPermissions.setPermissionCategory(Kernel.InputPermissionCategory.Movement, true);
                }
                Kernel.world.sendMessage(`§8[§aUnfreeze§8] §f${player.name} §7unfrozen §f${rawTarget.name}§7.`);
                if (rawTarget.isValid) rawTarget.sendMessage(`§a§l» §fYou have been unfrozen.`);
            } else {
                FreezeTracker.freezePlayer(rawTarget.id);
                if (rawTarget.inputPermissions) {
                    rawTarget.inputPermissions.setPermissionCategory(Kernel.InputPermissionCategory.Movement, false);
                }
                Kernel.world.sendMessage(`§8[§bFreeze§8] §f${player.name} §7froze §f${rawTarget.name}§7.`);
                if (rawTarget.isValid) rawTarget.sendMessage(`§b§l» §fYou have been frozen by §b${player.name}§f.`);
            }
        } catch (err) {
            player.sendMessage(`§c§l» §7Freeze command error: ${err.message}`);
        }
    }
};
