/**
 * SetWarp Command - Create a server-wide warp
 * Requires admin permission
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"

export const SetWarpCommand = {
    name: "setwarp",
    description: "Create a new server-wide warp",
    usage: "!setwarp <name>",
    permission: "essentials.warp.set",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]
        
        if (!name) {
            player.sendMessage("§cUsage: !setwarp <name>")
            return
        }

        // Validate warp name
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            player.sendMessage("§cWarp name can only contain letters, numbers, underscores, and hyphens")
            return
        }

        if (name.length < 1 || name.length > 16) {
            player.sendMessage("§cWarp name must be between 1 and 16 characters")
            return
        }

        const location = player.location
        const dimension = player.dimension.id

        const success = await WarpStore.setWarp(name, location, dimension, player.name)
        
        if (success) {
            player.sendMessage(`§aWarp '§e${name}§a' created at your current location`)
        } else {
            player.sendMessage("§cFailed to create warp. A warp with this name may already exist")
        }
    }
}
