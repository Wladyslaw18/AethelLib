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
            player.sendMessage("\xA7c\xA7l» \xA77You have no homes set.");
            return
        }

        // header display.
        player.sendMessage(" ")
        // TODO: Dynamically resolve the limit from RankSystem instead of hardcoded 10.
        player.sendMessage(`\xA76\xA7lYour Homes \xA78(\xA7e${homeNames.length}\xA78/\xA7e10\xA78):`)

        // step 2: iterative output.
        for (const name of homeNames) {
            const home = homes[name]
            // format the spatial coordinates.
            const coordText = `\xA77[\xA7e${home.x}\xA77, \xA7e${home.y}\xA77, \xA7e${home.z}\xA77]`
            // identify the dimension (e.g. overworld, nether).
            const dimensionText = `\xA78(\xA7f${home.dimension.split(':').pop()}\xA78)`
            player.sendMessage(`\xA76- \xA7f${name} ${coordText} ${dimensionText}`)
        }
        player.sendMessage(" ")
    }
}
