/**
 * SetHome Command - Create a new home
 */

import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system } from "@minecraft/server"

export const SetHomeCommand = {
    name: "sethome",
    description: "Create a new home at your current location",
    usage: "!sethome <name>",
    permission: "essentials.home",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]

        if (!name) {
            player.sendMessage("§cUsage: !sethome <name>")
            return
        }

        // Validate home name
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            player.sendMessage("§cHome name can only contain letters, numbers, underscores, and hyphens")
            return
        }

        if (name.length < 1 || name.length > 16) {
            player.sendMessage("§cHome name must be between 1 and 16 characters")
            return
        }

        const location = player.location
        const dimension = player.dimension.id

        const success = await HomeStore.setHome(player, name, location, dimension)

        if (success) {
            player.sendMessage(`§aHome '§e${name}§a' set at your current location`)
        } else {
            const homeCount = await HomeStore.getHomeCount(player)
            const homeLimit = RankSystem.getPermission(player, "home.limit") ?? 10
            player.sendMessage(`§cFailed to set home. You may have reached the maximum limit (${homeCount}/${homeLimit})`)
        }
    }
}

