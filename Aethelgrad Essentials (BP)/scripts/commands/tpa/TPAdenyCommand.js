/**
 * TPA Deny Command - Decline incoming TPA request
 * Smith Forge Rule: Max 100 lines per file
 */

import { world } from "@minecraft/server"
import { denyRequest, getPendingRequests } from "../../systems/tpa/TpaHandshake.js"

export const TPAdenyCommand = {
    name: "tpadeny",
    description: "Decline incoming TPA request",
    usage: "!tpadeny",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const pending = getPendingRequests(player.id)
        
        if (pending.length === 0) {
            player.sendMessage("§cYou have no pending TPA requests!")
            return
        }

        // Deny the first pending request
        const request = pending[0]
        const success = denyRequest(request.id)
        
        if (success) {
            const sender = world.getPlayers().find(p => p.id === request.senderId)
            if (sender) {
                player.sendMessage(`§aDeclined ${request.senderName}'s teleport request!`)
            }
        } else {
            player.sendMessage("§cFailed to deny request!")
        }
    }
}
