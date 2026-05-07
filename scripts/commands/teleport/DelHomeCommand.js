/**
 * DelHome Command - Delete a home
 */

import { HomeStore } from "../../systems/teleport/HomeStore.js"

export const DelHomeCommand = {
    name: "delhome",
    description: "Delete a home point",

    usage: "/ae:delhome <name>",
    permission: "essentials.home",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]
        
        if (!name) {
            player.sendMessage("§c§l» §7Usage: /ae:delhome <name>");
            return
        }


        const exists = await HomeStore.hasHome(player, name)
        
        if (!exists) {
            player.sendMessage(`§c§l» §7Home §e${name}§7 not found.`);
            return
        }


        const success = await HomeStore.deleteHome(player, name)
        
        if (success) {
            player.sendMessage(`§a§l» §fHome §e${name}§f has been deleted.`);
        } else {
            player.sendMessage("§c§l» §7Failed to delete home.");
        }

    }
}

