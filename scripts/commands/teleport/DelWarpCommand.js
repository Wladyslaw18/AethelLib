import { WarpStore } from "../../systems/teleport/WarpStore.js"

// ----------------------------------------------------------------------------
// | object: DelWarpCommand                                                   |
// | command definition for decommissioning global spatial anchors.             |
// | requires administrative permission nodes.                                 |
// ----------------------------------------------------------------------------
export const DelWarpCommand = {
    // internal identifier.
    name: "delwarp",
    // human-readable description.
    description: "Delete a global warp point",
    // syntax guide.
    usage: "/ae:delwarp <name>",
    // required permission node (admin level).
    permission: "essentials.warp.delete",
    // command category.
    category: "teleport",
    // native parameter definitions.
    parameters: [
        { name: "warpName", type: "string", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for warp removal. checks for existence before purging the     |
    // | global record from the registry.                                         |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        const name = args[0]
        
        // syntax check.
        if (!name) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:delwarp <name>");
            return
        }

        // step 1: existence check.
        const exists = await WarpStore.hasWarp(name)
        
        if (!exists) {
            player.sendMessage(`\xA7c\xA7l» \xA77Warp \xA7e${name}\xA77 not found.`);
            return
        }

        // step 2: decommissioning.
        const success = await WarpStore.deleteWarp(name)
        
        if (success) {
            player.sendMessage(`\xA7a\xA7l» \xA7fWarp \xA7e${name}\xA7f has been deleted.`);
        } else {
            // handle rare database state conflicts.
            player.sendMessage("\xA7c\xA7l» \xA77Failed to delete warp.");
        }
    }
}
