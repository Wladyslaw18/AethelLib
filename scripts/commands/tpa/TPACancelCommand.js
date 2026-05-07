/**
 * TPACancel Command - Cancel outgoing TPA requests
 * Smith Forge Rule: Max 100 lines per file
 */

import { Kernel } from "../../core/Kernel.js"

export const TPACancelCommand = {
    name: "tpacancel",
    description: "Cancel outgoing TPA request",
    usage: "/ae:tpacancel",
    permission: "essentials.tpa",
    category: "teleport",
    parameters: [
        { name: "target", type: "player", optional: true }
    ],

    async execute(_data, player, _args) {
        const TpaHandshake = Kernel.get("tpaHandshake")
        const request = TpaHandshake.getLatestRequestFrom(player.id)
        
        if (!request) {
            player.sendMessage("§c§l» §7You have no outgoing TPA requests.")
            return
        }

        TpaHandshake.removeRequest(request.id)
        player.sendMessage(`§a§l» §fTPA request to §e${request.targetName} §fcancelled.`)
        
        // Notify target if online
        const target = [...Kernel.world.getAllPlayers()].find(p => p.id === request.targetId)
        if (target) {
            target.sendMessage(`§c§l» §e${player.name} §7cancelled their TPA request.`)
        }
    }
}

