/**
 * Block Command - Block players from sending TPA requests
 * Smith Forge Rule: Max 100 lines per file
 */

import { TPAStore } from "../../systems/tpa/TpaStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

export const BlockCommand = {
    name: "block",
    description: "Block a player from TPA requests",
    usage: "/ae:block <player_name>",
    permission: "essentials.tpa",
    category: "teleport",
    parameters: [
        { name: "player", type: "player", optional: false }
    ],

    async execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:block <player_name>")
            player.sendMessage("§e§l» §fTip: §7Blocked players cannot send you TPA requests.")
            return
        }

        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        if (!target) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found or offline.`)
            return
        }


        if (target.id === player.id) {
            player.sendMessage("§c§l» §7You cannot block yourself!")
            return
        }


        // Check if already blocked
        const blocked = TPAStore.getBlocked(player.id)
        if (blocked.includes(target.id)) {
            player.sendMessage(`§c§l» §7${target.name} is already blocked.`)
            return
        }


        // Block the player
        TPAStore.blockPlayer(player.id, target.id)
        player.sendMessage(`§a§l» §fBlocked §e${target.name}§f from sending you TPA requests.`)

    }
}


