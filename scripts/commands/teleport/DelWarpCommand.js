/**
 * DelWarp Command - Delete a server-wide warp
 * Requires admin permission
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"

export const DelWarpCommand = {
    name: "delwarp",
    description: "Delete a server-wide warp",
    usage: "!delwarp <name>",
    permission: "essentials.warp.delete",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]
        
        if (!name) {
            player.sendMessage("§cUsage: !delwarp <name>")
            return
        }

        const exists = await WarpStore.hasWarp(name)
        
        if (!exists) {
            player.sendMessage(`§cWarp '§e${name}§c' not found`)
            return
        }

        const success = await WarpStore.deleteWarp(name)
        
        if (success) {
            player.sendMessage(`§aWarp '§e${name}§a' deleted`)
        } else {
            player.sendMessage("§cFailed to delete warp")
        }
    }
}

