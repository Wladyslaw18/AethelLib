/**
 * ListWarp Command - List all server-wide warps
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"

export const ListWarpCommand = {
    name: "listwarp",
    description: "View a list of global warps",

    usage: "/ae:listwarp",
    permission: "essentials.warp",
    category: "teleport",

    async execute(data, player, args) {
        const warps = await WarpStore.getWarps()
        const warpNames = Object.keys(warps)
        
        if (warpNames.length === 0) {
            player.sendMessage("§c§l» §7No warps have been set.");
            return
        }


        player.sendMessage(" ")
        player.sendMessage(`§6§lGlobal Warps §8(§e${warpNames.length}§8):`)

        
        for (const name of warpNames) {
            const warp = warps[name]
            const coordText = `§7[§e${warp.x}§7, §e${warp.y}§7, §e${warp.z}§7]`
            const dimensionText = `§8(§f${warp.dimension}§8)`
            const creatorText = `§8by §a${warp.creator}`
            player.sendMessage(`§6- §f${name} ${coordText} ${dimensionText} ${creatorText}`)
        }
        player.sendMessage(" ")
    }

}

