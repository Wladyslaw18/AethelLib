import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { SeenStore } from "../../systems/stores/SeenStore.js";

export const SeenCommand = {
    name: "seen",
    description: "Check when a player was last online",
    usage: "/ae:seen <player>",
    permission: "essentials.seen",
    category: "PLAYER",
    native: false,
    params: [
        { name: "player", type: "player", optional: false }
    ],
    execute(data, player, args) {
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        
        // This command should ideally accept offline player names too, 
        // but resolveFromArgs only gets online ones.
        // We'll use the raw arg to look up in the DB just in case.
        const targetName = target ? target.name : args[0];
        const targetId = target ? target.id : null; // In a full impl, we'd need an ID lookup by name

        if (target) {
            player.sendMessage(`§a§l» §f${target.name} §7is currently §aONLINE§7.`);
            return;
        }
        
        player.sendMessage(`§c§l» §7Offline player lookup by name is not fully supported in this version without an ID index. (Requested: ${targetName})`);
        
        /* 
        // Ideal implementation if we had an ID->Name index:
        const data = SeenStore.getPlayerData(resolvedId);
        if (!data || data.lastSeen === 0) {
            player.sendMessage(`§c§l» §7Player '${targetName}' has no recorded login data.`);
            return;
        }
        
        const lastSeenDate = new Date(data.lastSeen).toLocaleString();
        player.sendMessage(`§a§l» §f${data.name} §7was last seen on §e${lastSeenDate}§7.`);
        */
    }
};
