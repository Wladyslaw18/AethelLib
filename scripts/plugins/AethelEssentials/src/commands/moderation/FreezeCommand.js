import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { FreezeTracker } from "../../systems/stores/FreezeTracker.js";
import { InputPermissionCategory } from "@minecraft/server";
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
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        
        if (!target) {
            player.sendMessage("§c§l» §7Player not found.");
            return;
        }

        const isFrozen = FreezeTracker.isFrozen(target.id);

        if (isFrozen) {
            FreezeTracker.unfreezePlayer(target.id);
            target.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true);
            this.context.world.sendMessage(`§8[§aUnfreeze§8] §f${player.name} §7unfrozen §f${target.name}§7.`);
            target.sendMessage(`§a§l» §fYou have been unfrozen.`);
        } else {
            FreezeTracker.freezePlayer(target.id);
            target.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false);
            this.context.world.sendMessage(`§8[§bFreeze§8] §f${player.name} §7froze §f${target.name}§7.`);
            target.sendMessage(`§b§l» §fYou have been frozen by §b${player.name}§f.`);
        }
    }
};
