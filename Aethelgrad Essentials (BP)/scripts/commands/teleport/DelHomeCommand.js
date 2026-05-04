/**
 * DelHome Command - Delete a home
 */

import { HomeStore } from "../../systems/teleport/HomeStore.js"

export const DelHomeCommand = {
    name: "delhome",
    description: "Delete one of your homes",
    usage: "!delhome <name>",
    permission: "essentials.home",
    category: "teleport",

    async execute(data, player, args) {
        const name = args[0]
        
        if (!name) {
            player.sendMessage("§cUsage: !delhome <name>")
            return
        }

        const exists = await HomeStore.hasHome(player, name)
        
        if (!exists) {
            player.sendMessage(`§cHome '§e${name}§c' not found`)
            return
        }

        const success = await HomeStore.deleteHome(player, name)
        
        if (success) {
            player.sendMessage(`§aHome '§e${name}§a' deleted`)
        } else {
            player.sendMessage("§cFailed to delete home")
        }
    }
}
