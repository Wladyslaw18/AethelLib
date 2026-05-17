import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: WarpCommand                                                      |
// | command definition for traveling to public server anchors.                |
// | interfaces with the WarpStore to resolve global coordinate data.          |
// ----------------------------------------------------------------------------
export const WarpCommand = {
    // internal name.
    name: "warp",
    // human-readable description.
    description: "Teleport to a global warp point",
    // syntax guide.
    usage: "/ae:warp <waypoint_identifier>",
    // required permission node.
    permission: "essentials.warp",
    // command category.
    category: "TELEPORTATION",
    // native parameter definitions.
    parameters: [
        { name: "warpName", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the spatial migration vector. resolves the warp metadata and triggers     |
    // | the teleport service.                                                    |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax check.
        const name = args[0]
        if (!name || typeof name !== "string") {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:warp <warp_name>");
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Type a valid warp name to teleport.");
            return
        }

        // step 1: resolve the warp record from global storage.
        const warp = await WarpStore.getWarp(name)
        // resolve the teleport service from the kernel.
        const teleportService = Kernel.get("teleportService")

        // check if the record exists.
        if (!warp) {
            player.sendMessage(`\xA7c\xA7l» \xA77Warp point '${name}' not found.`);
            return
        }

        // step 2: migration execution.
        // add 0.5 to x/z for block centering.
        teleportService.teleport(player, { x: warp.x + 0.5, y: warp.y, z: warp.z + 0.5 }, warp.dimension);
        // feedback to the player.
        player.sendMessage(`\xA7a\xA7l» \xA7fTeleported to warp \xA7e${name}\xA7f.`);
    }
}
