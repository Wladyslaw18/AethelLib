import { WarpStore } from "../../systems/teleport/WarpStore.js"

// ----------------------------------------------------------------------------
// | object: ListWarpCommand                                                  |
// | command definition for displaying the server-wide public spatial registry. |
// | pulls records from the WarpStore and formats them for chat output.        |
// ----------------------------------------------------------------------------
export const ListWarpCommand = {
    // internal name.
    name: "listwarp",
    // human-readable description.
    description: "View a list of global warps",
    // syntax guide.
    usage: "/ae:listwarp",
    // required permission level.
    permission: "essentials.warp",
    // command category.
    category: "teleport",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | manifest generation pipeline. pulls records and formats them into a       |
    // | readable list with spatial and attribution metadata.                     |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // step 1: retrieve all registered global warps.
        const warps = await WarpStore.getWarps()
        // extract the names (keys).
        const warpNames = Object.keys(warps)
        
        // safety check: if no public waypoints have been established.
        if (warpNames.length === 0) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77No warps have been set.");
            return
        }

        // header display.
        player.sendMessage(" ")
        player.sendMessage(`\u00A76\u00A7lGlobal Warps \u00A78(\u00A7e${warpNames.length}\u00A78):`)

        // step 2: iterative output.
        for (const name of warpNames) {
            const warp = warps[name]
            // format spatial coordinates.
            const coordText = `\u00A77[\u00A7e${warp.x}\u00A77, \u00A7e${warp.y}\u00A77, \u00A7e${warp.z}\u00A77]`
            // resolve dimension name.
            const dimensionText = `\u00A78(\u00A7f${warp.dimension.split(':').pop()}\u00A78)`
            // display the original creator of the warp node.
            const creatorText = `\u00A78by \u00A7a${warp.creator}`
            player.sendMessage(`\u00A76- \u00A7f${name} ${coordText} ${dimensionText} ${creatorText}`)
        }
        player.sendMessage(" ")
    }
}
