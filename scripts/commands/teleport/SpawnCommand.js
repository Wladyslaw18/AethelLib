import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: SpawnCommand                                                     |
// | command definition for traveling to the centralized server hub.           |
// | effectively a hardcoded router for a warp named "spawn".                 |
// ----------------------------------------------------------------------------
export const SpawnCommand = {
    // internal name.
    name: "spawn",
    // human-readable description.
    description: "Return to the server spawn point",
    // syntax guide.
    usage: "/ae:spawn",
    // required permission node.
    permission: "essentials.spawn",
    // command category.
    category: "teleport",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | resolves the "spawn" warp record and triggers the migration.             |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // query the warp registry for the specific "spawn" identifier.
        const spawn = await WarpStore.getWarp("spawn")
        // resolve the teleport service from the kernel.
        const teleportService = Kernel.get("teleportService")
        
        // check if an admin has actually set the spawn location.
        if (!spawn) {
            player.sendMessage("\xA7c\xA7l» \xA77Spawn has not been set yet.");
            return
        }

        // execute the spatial jump.
        teleportService.teleport(player, { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 }, spawn.dimension);
        // feedback to the player.
        player.sendMessage("\xA7a\xA7l» \xA7fTeleported to spawn.");
    }
}
