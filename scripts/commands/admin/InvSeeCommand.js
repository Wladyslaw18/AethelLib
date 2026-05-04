/**
 * Inventory See Command - View and manage player inventories
 */

import { world, system } from "@minecraft/server"
import { showInventoryUI } from "./InvSeeUI.js"

export const InvSeeCommand = {
    name: "invsee",
    description: "View and manage player inventory",
    usage: "!invsee <playerName>",
    permission: "essentials.admin.invsee",
    category: "admin",

    async execute(data, player, args) {
        if (args.length < 1) {
            player.sendMessage("§cUsage: !invsee <playerName>")
            return
        }

        const playerName = args[0]
        const target = world.getAllPlayers().find(p => p.name === playerName)
        
        if (!target) {
            player.sendMessage(`§cPlayer '${playerName}' not found or not online`)
            return
        }

        await showInventoryUI(player, target)
    }
}

