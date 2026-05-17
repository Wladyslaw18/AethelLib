import { HomeStore } from "../../systems/teleport/HomeStore.js"

// ----------------------------------------------------------------------------
// | object: DelHomeCommand                                                   |
// | command definition for decommissioning persistent spatial waypoints.      |
// | purges coordinate data from the player's persistent store.               |
// ----------------------------------------------------------------------------
export const DelHomeCommand = {
    // internal name.
    name: "delhome",
    // human-readable description.
    description: "Delete a home point",
    // syntax guide.
    usage: "/ae:delhome <name>",
    // required permission level.
    permission: "essentials.home",
    // command category.
    category: "teleport",
    // native parameter definitions.
    parameters: [
        { name: "homeName", type: "string", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for home removal. checks for existence before purging.       |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        const name = args[0]
        
        // basic syntax check.
        if (!name) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:delhome <name>");
            return
        }

        // step 1: existence check.
        // query the store to see if this waypoint actually exists.
        const exists = await HomeStore.hasHome(player, name)
        
        if (!exists) {
            player.sendMessage(`\xA7c\xA7l» \xA77Home \xA7e${name}\xA77 not found.`);
            return
        }

        // step 2: decommissioning.
        // call the purge logic in the home store.
        const success = await HomeStore.deleteHome(player, name)
        
        if (success) {
            // notify the player of the successful purge.
            player.sendMessage(`\xA7a\xA7l» \xA7fHome \xA7e${name}\xA7f has been deleted.`);
        } else {
            // handle rare database lock/io failures.
            player.sendMessage("\xA7c\xA7l» \xA77Failed to delete home.");
        }
    }
}
