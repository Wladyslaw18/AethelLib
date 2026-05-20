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
        { name: "homeName", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for home removal. checks for existence before purging.       |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        let name = args[0]
        if (name !== undefined && name !== null) {
            name = String(name)
        }
        
        // basic syntax check.
        if (!name) {
            const { showHomeUI } = await import("../../ui/teleport/HomeUI.js")
            Kernel.system.run(() => showHomeUI(player))
            return
        }

        // step 1: existence check.
        // query the store to see if this waypoint actually exists.
        const exists = await HomeStore.hasHome(player, name)
        
        if (!exists) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Home \u00A7e${name}\u00A77 not found.`);
            return
        }

        // step 2: decommissioning.
        // call the purge logic in the home store.
        const success = await HomeStore.deleteHome(player, name)
        
        if (success) {
            // notify the player of the successful purge.
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fHome \u00A7e${name}\u00A7f has been deleted.`);
        } else {
            // handle rare database lock/io failures.
            player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to delete home.");
        }
    }
}
