import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { JailStore } from "../../systems/stores/JailStore.js";
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
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        
        if (!target) {
            player.sendMessage("§c§l» §7Player not found.");
            return;
        }

        if (!JailStore.isJailed(target.id)) {
            player.sendMessage("§c§l» §7Player is not jailed.");
            return;
        }

        JailStore.unjailPlayer(target.id);
        
        this.context.world.sendMessage(`§8[§aUnjail§8] §f${player.name} §7unjailed §f${target.name}§7.`);
        target.sendMessage(`§a§l» §fYou have been unjailed by §a${player.name}§f.`);
    }
};
