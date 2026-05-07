import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

export const WhoisCommand = {
    name: "whois",
    description: "View detailed player information",

    usage: "/ae:whois <player>",
    permission: "essentials.whois",
    category: "Utility",

    execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Please provide a player name.");
            return
        }

        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        if (!target) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found.`);
            return
        }

        const PermissionManager = Kernel.get("permissions")
        const Economy = Kernel.get("economy")
        const TpaStore = Kernel.get("tpaStore")
        
        const rank = PermissionManager.getHighestRank(target)
        const balance = Economy.getBalance(target)
        const tpaStatus = TpaStore.isEnabled(target.id) ? "§aEnabled" : "§cDisabled"

        player.sendMessage(`§6§l» §ePlayer Info: §f${target.name} §6§l«`)
        player.sendMessage(`§7Rank: §e${rank?.displayName || "Member"}`)
        player.sendMessage(`§7Balance: §6$${balance.toLocaleString()}`)
        player.sendMessage(`§7Dimension: §b${target.dimension.id.split(':')[1].toUpperCase()}`)
        player.sendMessage(`§7Coords: §8(${Math.floor(target.location.x)}, ${Math.floor(target.location.y)}, ${Math.floor(target.location.z)})`)
        player.sendMessage(`§7TPA: ${tpaStatus}`)
    }
}

