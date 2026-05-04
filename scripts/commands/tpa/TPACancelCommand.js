/**
 * TPACancel Command - Cancel TPA requests
 */

import { TPAStore } from "../../systems/tpa/TpaStore.js"
import { getPendingRequests } from "../../systems/tpa/TpaHandshake.js"

export const TPACancelCommand = {
    name: "tpacancel",
    description: "Cancel TPA requests",
    usage: "!tpacancel [on/off|player_name]",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const option = args[0]?.toLowerCase()
        
        if (!option) {
            // Cancel all requests for this player (both sent and received)
            const cancelled = await TPAStore.cancelAllRequestsForPlayer(player.id)
            
            if (cancelled) {
                player.sendMessage("§aAll your TPA requests have been cancelled")
            } else {
                player.sendMessage("§7You have no active TPA requests")
            }
            return
        }

        if (option === "on" || option === "off") {
            // Toggle TPA settings
            const enabled = option === "on"
            const success = await TPAStore.setSettings(player.id, { enabled })
            
            if (success) {
                player.sendMessage(`§aTPA requests ${enabled ? "enabled" : "disabled"}`)
            }
            return
        }

        // Cancel specific request with player name
        const pendingRequests = await getPendingRequests(player.id)
        const requestToCancel = pendingRequests.find(req => 
            (req.senderName.toLowerCase() === option && req.senderId === player.id) ||
            (req.targetName.toLowerCase() === option && req.targetId === player.id)
        )

        if (!requestToCancel) {
            player.sendMessage(`§cNo active TPA request with '§e${option}§c'`)
            return
        }

        const cancelled = await TPAStore.cancelRequest(requestToCancel.id)
        
        if (cancelled) {
            player.sendMessage(`§aTPA request with §e${requestToCancel.senderName === player.name ? requestToCancel.targetName : requestToCancel.senderName}§a cancelled`)
        } else {
            player.sendMessage("§cFailed to cancel TPA request")
        }
    }
}

