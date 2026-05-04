/**
 * ListWarp Command - List all server-wide warps
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"

export const ListWarpCommand = {
    name: "listwarp",
    description: "List all server-wide warps",
    usage: "!listwarp",
    permission: "essentials.warp",
    category: "teleport",

    async execute(data, player, args) {
        const warps = await WarpStore.getWarps()
        const warpNames = Object.keys(warps)
        
        if (warpNames.length === 0) {
            player.sendMessage("§7No warps have been set")
            return
        }

        player.sendMessage(`§6Server Warps (${warpNames.length}):`)
        
        for (const name of warpNames) {
            const warp = warps[name]
            const coordText = `§7[${warp.x}, ${warp.y}, ${warp.z}]`
            const dimensionText = `§8(${warp.dimension})`
            const creatorText = `§aby ${warp.creator}`
            player.sendMessage(`§e- ${name} ${coordText} ${dimensionText} ${creatorText}`)
        }
    }
}

