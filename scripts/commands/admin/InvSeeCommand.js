import { world, system } from "@minecraft/server"
import { showInventoryUI } from "./InvSeeUI.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

export const InvSeeCommand = {
    name: "invsee",
    description: "View a player's inventory",

    usage: "/ae:invsee <player_identifier>",
    permission: "essentials.admin.invsee",
    category: "Admin",

    execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:invsee <player_name>");
            return
        }


        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)
        
        if (!target) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found.`);
            return
        }


        system.run(() => {
            showInventoryUI(player, target)
        })
    }
}
