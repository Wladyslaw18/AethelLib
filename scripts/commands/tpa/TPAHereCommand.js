import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

export const TPAHereCommand = {
    name: "tpahere",
    description: "Request another player to teleport to you",
    usage: "/ae:tpahere <player_name>",
    permission: "essentials.tpa",
    category: "teleport",
    // No explicit parameters to allow spaces in names via catch-all

    async execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:tpahere <player>");
            return
        }


        const targetName = args.join(" ")
        const targetPlayer = PlayerUtils.findPlayer(targetName)

        if (!targetPlayer) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found.`);
            return
        }


        if (targetPlayer.id === player.id) {
            player.sendMessage("§c§l» §7You cannot send a TPA request to yourself.");
            return
        }


        const TpaService = Kernel.get("tpaService")
        const success = TpaService.sendRequest(player, targetPlayer, "tpahere")

        if (success) {
            player.sendMessage(`§a§l» §fTPAHere request sent to §e${targetPlayer.name}§f.`);
        }

    }
}
