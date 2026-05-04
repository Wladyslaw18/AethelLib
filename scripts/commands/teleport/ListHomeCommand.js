/**
 * ListHome Command - List all homes
 */

import { HomeStore } from "../../systems/teleport/HomeStore.js"

export const ListHomeCommand = {
    name: "listhome",
    description: "List all of your homes",
    usage: "!listhome",
    permission: "essentials.home",
    category: "teleport",

    async execute(data, player, args) {
        const homes = await HomeStore.getHomes(player)
        const homeNames = Object.keys(homes)
        
        if (homeNames.length === 0) {
            player.sendMessage("§7You have no homes set")
            return
        }

        player.sendMessage(`§6Your Homes (${homeNames.length}/10):`)
        
        for (const name of homeNames) {
            const home = homes[name]
            const coordText = `§7[${home.x}, ${home.y}, ${home.z}]`
            const dimensionText = `§8(${home.dimension})`
            player.sendMessage(`§e- ${name} ${coordText} ${dimensionText}`)
        }
    }
}

