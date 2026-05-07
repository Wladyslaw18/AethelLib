/**
 * SetWarp Command - Create a server-wide warp
 * Requires admin permission
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"

export const SetWarpCommand = {
    name: "setwarp",
    description: "Create a global warp point",

    usage: "/ae:setwarp <name>",
    permission: "essentials.warp.set",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]
        
        if (!name) {
            player.sendMessage("§c§l» §7Usage: /ae:setwarp <name>");
            return
        }


        // Validate warp name
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            player.sendMessage("§c§l» §7Warp name can only contain alphanumeric characters.");
            return
        }


        if (name.length < 1 || name.length > 16) {
            player.sendMessage("§c§l» §7Warp name must be between 1-16 characters.");
            return
        }


        const location = player.location
        const dimension = player.dimension.id

        const success = await WarpStore.setWarp(name, location, dimension, player.name)
        
        if (success) {
            player.sendMessage(`§a§l» §fWarp §e${name}§f has been created.`);
        } else {
            player.sendMessage("§c§l» §7Failed to create warp. Name may be taken.");
        }

    }
}

