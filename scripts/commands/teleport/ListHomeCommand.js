import { HomeStore } from "../../systems/teleport/HomeStore.js"

// ----------------------------------------------------------------------------
// | object: ListHomeCommand                                                  |
// | command definition for displaying the player's saved spatial manifest.     |
// | pulls all registered waypoints and prints their coordinates/dimensions.   |
// ----------------------------------------------------------------------------
export const ListHomeCommand = {
    // internal name.
    name: "listhome",
    // human-readable description.
    description: "View a list of your homes",
    // syntax guide.
    usage: "/ae:listhome",
    // required permission level.
    permission: "essentials.home",
    // command category.
    category: "teleport",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | manifest generation pipeline. pulls records from the HomeStore and       |
    // | formats them for chat output.                                            |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // step 1: retrieve all home records for this player.
        const homes = await HomeStore.getHomes(player)
        // extract the names (keys) of the homes.
        const homeNames = Object.keys(homes)
        
        // safety check: if the player hasn't saved anything yet.
        if (homeNames.length === 0) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You have no homes set.");
            return
        }

        // header display.
        player.sendMessage(" ")
        // TODO: Dynamically resolve the limit from RankSystem instead of hardcoded 10.
        player.sendMessage(`\u00A76\u00A7lYour Homes \u00A78(\u00A7e${homeNames.length}\u00A78/\u00A7e10\u00A78):`)

        // step 2: iterative output.
        for (const name of homeNames) {
            const home = homes[name]
            // format the spatial coordinates.
            const coordText = `\u00A77[\u00A7e${home.x}\u00A77, \u00A7e${home.y}\u00A77, \u00A7e${home.z}\u00A77]`
            // identify the dimension (e.g. overworld, nether).
            const dimensionText = `\u00A78(\u00A7f${home.dimension.split(':').pop()}\u00A78)`
            player.sendMessage(`\u00A76- \u00A7f${name} ${coordText} ${dimensionText}`)
        }
        player.sendMessage(" ")
    }
}
