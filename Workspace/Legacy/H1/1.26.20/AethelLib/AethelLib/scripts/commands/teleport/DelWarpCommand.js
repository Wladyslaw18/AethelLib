/**
 * DelWarp Command - Delete a server-wide warp
 * Requires admin permission
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"

export const DelWarpCommand = {
    name: "delwarp",
    description: "Delete a global warp point",

    usage: "/ae:delwarp <name>",
    permission: "essentials.warp.delete",
    category: "teleport",
    parameters: [
        { name: "warpName", type: "string", optional: false }
    ],

    async execute(_data, player, args) {
        const name = args[0]
        
        if (!name) {
            player.sendMessage("§c§l» §7Usage: /ae:delwarp <name>");
            return
        }


        const exists = await WarpStore.hasWarp(name)
        
        if (!exists) {
            player.sendMessage(`§c§l» §7Warp §e${name}§7 not found.`);
            return
        }


        const success = await WarpStore.deleteWarp(name)
        
        if (success) {
            player.sendMessage(`§a§l» §fWarp §e${name}§f has been deleted.`);
        } else {
            player.sendMessage("§c§l» §7Failed to delete warp.");
        }

    }
}



