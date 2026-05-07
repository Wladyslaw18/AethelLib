/**
 * SetHome Command - Create a new home
 */

import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system } from "@minecraft/server"

export const SetHomeCommand = {
    name: "sethome",
    description: "Create a new home point",

    usage: "/ae:sethome <name>",
    permission: "essentials.home",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]

        if (!name) {
            const { showCreateHomeUI } = await import("../../ui/teleport/HomeActionUI.js")
            system.run(() => showCreateHomeUI(player))
            return
        }

        // Validate home name
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            player.sendMessage("§c§l» §7Home name can only contain alphanumeric characters.");
            return
        }


        if (name.length < 1 || name.length > 16) {
            player.sendMessage("§c§l» §7Home name must be between 1-16 characters.");
            return
        }


        const location = player.location
        const dimension = player.dimension.id

        const success = await HomeStore.setHome(player, name, location, dimension)

        if (success) {
            player.sendMessage(`§a§l» §fHome §e${name}§f has been set.`);
        } else {

            const homeCount = await HomeStore.getHomeCount(player)
            const homeLimit = RankSystem.getPermission(player, "home.limit") ?? 10
            player.sendMessage(`§c§l» §7Failed to set home. Limit: §e${homeCount}/${homeLimit}§7.`);
        }

    }
}

