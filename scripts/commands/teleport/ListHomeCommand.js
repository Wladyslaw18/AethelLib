/**
 * ListHome Command - List all homes
 */

import { HomeStore } from "../../systems/teleport/HomeStore.js"

export const ListHomeCommand = {
    name: "listhome",
    description: "View a list of your homes",

    usage: "/ae:listhome",
    permission: "essentials.home",
    category: "teleport",

    async execute(_data, player, _args) {
        const homes = await HomeStore.getHomes(player)
        const homeNames = Object.keys(homes)
        
        if (homeNames.length === 0) {
            player.sendMessage("§c§l» §7You have no homes set.");
            return
        }


        player.sendMessage(" ")
        player.sendMessage(`§6§lYour Homes §8(§e${homeNames.length}§8/§e10§8):`)

        
        for (const name of homeNames) {
            const home = homes[name]
            const coordText = `§7[§e${home.x}§7, §e${home.y}§7, §e${home.z}§7]`
            const dimensionText = `§8(§f${home.dimension}§8)`
            player.sendMessage(`§6- §f${name} ${coordText} ${dimensionText}`)
        }
        player.sendMessage(" ")
    }

}


