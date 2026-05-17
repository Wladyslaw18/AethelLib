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
            player.sendMessage("\xA7c\xA7l» \xA77No warps have been set.");
            return
        }

        // header display.
        player.sendMessage(" ")
        player.sendMessage(`\xA76\xA7lGlobal Warps \xA78(\xA7e${warpNames.length}\xA78):`)

        // step 2: iterative output.
        for (const name of warpNames) {
            const warp = warps[name]
            // format spatial coordinates.
            const coordText = `\xA77[\xA7e${warp.x}\xA77, \xA7e${warp.y}\xA77, \xA7e${warp.z}\xA77]`
            // resolve dimension name.
            const dimensionText = `\xA78(\xA7f${warp.dimension.split(':').pop()}\xA78)`
            // display the original creator of the warp node.
            const creatorText = `\xA78by \xA7a${warp.creator}`
            player.sendMessage(`\xA76- \xA7f${name} ${coordText} ${dimensionText} ${creatorText}`)
        }
        player.sendMessage(" ")
    }
}
