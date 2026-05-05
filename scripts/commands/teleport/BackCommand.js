/**
 * Back Command - Return to last known location
 */

import { Kernel } from "../../core/Kernel.js"

export const BackCommand = {
    name: "back",
    description: "Teleport to your last location (teleport or death)",
    usage: "!back",
    permission: "essentials.back",
    category: "teleport",

    execute(_data, player, _args) {
        const TeleportService = Kernel.get("teleportService")
        const lastPos = TeleportService.getLastPosition(player.id)

        if (!lastPos) {
            return player.sendMessage("§cNo previous location recorded.")
        }

        player.sendMessage("§aReturning to last location...")
        
        // Use TeleportService to perform the teleport (this also updates the current pos to the "new" back)
        TeleportService.teleport(player, lastPos.location, lastPos.dimensionId)
    }
}
