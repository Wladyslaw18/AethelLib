/**
 * Unblock Command - Unblock players from TPA requests
 * Smith Forge Rule: Max 100 lines per file
 */

import { TPAStore } from "../../systems/tpa/TpaStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

export const UnblockCommand = {
    name: "unblock",
    description: "Unblock a player from TPA requests",
    usage: "/ae:unblock <player_name>",
    permission: "essentials.tpa",
    category: "teleport",
    parameters: [
        { name: "player", type: "player", optional: false }
    ],

    async execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:unblock <player_name>")
            player.sendMessage("§e§l» §fTip: §7Unblocking allows that player to send TPA requests again.")
            return
        }

        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        if (!target) {
            player.sendMessage(`§c§l» §7Player '§e${targetName}§7' not found or not online.`)
            return
        }

        // Check if already unblocked
        const blocked = TPAStore.getBlocked(player.id)
        if (!blocked.includes(target.id)) {
            player.sendMessage(`§c§l» §7${target.name} is not in your block list.`)
            return
        }

        TPAStore.unblockPlayer(player.id, target.id)
        player.sendMessage(`§a§l» §fUnblocked §e${target.name}§f from sending you TPA requests.`)
    }
}


