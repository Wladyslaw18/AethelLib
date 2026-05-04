/**
 * TPA Accept Command - Accept incoming TPA request
 * Smith Forge Rule: Max 100 lines per file
 */

import { world } from "@minecraft/server"
import { acceptRequest, getPendingRequests } from "../../systems/tpa/TpaHandshake.js"

export const TPAcceptCommand = {
    name: "tpaccept",
    description: "Accept incoming TPA request",
    usage: "!tpaccept",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(_data, player, _args) {
        const pending = getPendingRequests(player.id)

        if (pending.length === 0) {
            player.sendMessage("§cYou have no pending TPA requests!")
            return
        }

        // Accept the first pending request
        const request = pending[0]
        const success = acceptRequest(request.id)

        if (success) {
            const sender = world.getPlayers().find(p => p.id === request.senderId)
            if (sender) {
                player.sendMessage(`§aAccepted ${request.senderName}'s teleport request!`)
            }
        } else {
            player.sendMessage("§cFailed to accept request!")
        }
    }
}
