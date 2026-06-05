import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { SeenStore } from "../../systems/stores/SeenStore.js";

export const PlaytimeCommand = {
    name: "playtime",
    description: "Check your or another player's total playtime",
    usage: "/ae:playtime [player]",
    permission: "essentials.playtime",
    category: "PLAYER",
    native: false,
    params: [
        { name: "player", type: "player", optional: true }
    ],
    execute(data, player, args) {
        let target = player;
        
        if (args.length > 0) {
            const { player: resolved } = PlayerUtils.resolveFromArgs(args);
            if (resolved) {
                target = resolved;
            } else {
                 player.sendMessage("§c§l» §7Player not found.");
                 return;
            }
        }
        
        const seenData = SeenStore.getPlayerData(target.id);
        
        if (!seenData) {
            player.sendMessage("§c§l» §7No playtime data recorded yet.");
            return;
        }
        
        // Calculate current session if online
        let totalTime = seenData.totalPlaytime;
        if (seenData.sessionStart > 0) {
            totalTime += (Date.now() - seenData.sessionStart);
        }
        
        // Format to hours, minutes
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeStr = `${hours}h ${minutes}m`;
        
        if (target.id === player.id) {
            player.sendMessage(`§a§l» §7Your total playtime is: §e${timeStr}§7.`);
        } else {
            player.sendMessage(`§a§l» §f${target.name}§7's total playtime is: §e${timeStr}§7.`);
        }
    }
};
