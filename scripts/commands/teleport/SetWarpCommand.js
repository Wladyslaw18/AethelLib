import { WarpStore } from "../../systems/teleport/WarpStore.js"

// ----------------------------------------------------------------------------
// | object: SetWarpCommand                                                   |
// | command definition for creating server-wide public spatial anchors.        |
// | handles administrative validation and global capacity constraints.        |
// ----------------------------------------------------------------------------
export const SetWarpCommand = {
    // internal identifier.
    name: "setwarp",
    // human-readable description.
    description: "Create a global warp point",
    // syntax guide.
    usage: "/ae:setwarp <name>",
    // required permission level (administrative clearance).
    permission: "essentials.warp.set",
    // command category.
    category: "teleport",
    // native parameter definitions.
    parameters: [
        { name: "warpName", type: "string", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the warp registration pipeline. ensures name uniqueness and validates    |
    // | spatial metadata before committing to the global registry.                |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        const name = args[0]
        
        // syntax validation.
        if (!name) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:setwarp <name>");
            return
        }

        // step 1: name validation.
        // industrial-standard alphanumeric check.
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            player.sendMessage("\xA7c\xA7l» \xA77Warp name can only contain alphanumeric characters.");
            return
        }

        // prevent database bloat and UI overflow.
        if (name.length < 1 || name.length > 16) {
            player.sendMessage("\xA7c\xA7l» \xA77Warp name must be between 1-16 characters.");
            return
        }

        // step 2: resolve current spatial coordinates.
        const location = player.location
        const dimension = player.dimension.id

        // step 3: global capacity check.
        // we cap the total number of warps to 50 to maintain fast lookup times.
        const warps = await WarpStore.getWarps();
        if (warps.length >= 50) {
            player.sendMessage(`\xA7c\xA7l» \xA77Failed to set warp. Global server limit (50) reached.`);
            return;
        }
        
        // step 4: persistence commitment.
        // calls the warp store to write the record to world storage.
        const success = await WarpStore.setWarp(name, location, dimension, player.name)
        
        if (success) {
            player.sendMessage(`\xA7a\xA7l» \xA7fWarp \xA7e${name}\xA7f has been created.`);
        } else {
            // handle collision with existing warp names.
            player.sendMessage("\xA7c\xA7l» \xA77Failed to create warp. Name may be taken.");
        }
    }
}
