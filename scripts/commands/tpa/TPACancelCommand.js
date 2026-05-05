/**
 * TPACancel Command - Cancel outgoing TPA requests
 * Smith Forge Rule: Max 100 lines per file
 */

import { Kernel } from "../../core/Kernel.js"

export const TPACancelCommand = {
    name: "tpacancel",
    description: "Cancel outgoing TPA request",
    usage: "!tpacancel",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(_data, player, _args) {
        const TpaHandshake = Kernel.get("tpaHandshake")
        const request = TpaHandshake.getLatestRequestFrom(player.id)
        
        if (!request) {
            player.sendMessage("§cERROR: NO_OUTGOING_HANDSHAKES_FOUND");
            return
        }

        TpaHandshake.removeRequest(request.id)
        player.sendMessage(`§aHANDSHAKE_CANCELLED: Bridge to ${request.targetName} decommissioned.`);
        
        // Notify target if online
        const target = [...Kernel.world.getAllPlayers()].find(p => p.id === request.targetId)
        if (target) {
            target.sendMessage(`§cNOTICE: ${player.name} cancelled the spatial bridge request.`);
        }
    }
}
