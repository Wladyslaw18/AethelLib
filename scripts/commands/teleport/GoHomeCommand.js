import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | variable: cooldowns                                                      |
// | in-memory registry of player IDs and their last execution tick.          |
// | used to throttle teleportation frequency.                                 |
// ----------------------------------------------------------------------------
const cooldowns = new Map()

// ----------------------------------------------------------------------------
// | object: GoHomeCommand                                                     |
// | command definition for traveling back to a saved spatial waypoint.        |
// | integrates with the TeleportService for movement logic and wait times.    |
// ----------------------------------------------------------------------------
export const GoHomeCommand = {
    // internal name.
    name: "home",
    // human-readable description.
    description: "Teleport to one of your homes",
    // syntax guide.
    usage: "/ae:home <anchor_identifier>",
    // required permission node.
    permission: "essentials.home",
    // command category.
    category: "TELEPORTATION",
    // native parameter definitions.
    parameters: [
        { name: "homeName", type: "string", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the relocation pipeline. handles cooldown checks, home resolution,        |
    // | and triggers the teleportation sequence (with or without wait).          |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax check.
        const name = args[0]
        if (!name) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:home <home_name>");
            return
        }

        // resolve core services from the kernel.
        const PermissionManager = Kernel.get("permissions")
        const TeleportService = Kernel.get("teleportService")

        // step 1: cooldown resolution.
        // check if the player is still in their temporal recharge window.
        const cdValue = PermissionManager.hasPermission(player, "home.cooldown") ?? 30
        const cd = Number(cdValue) * 20
        const last = cooldowns.get(player.id) ?? 0
        
        if (Kernel.system.currentTick - last < cd) {
            const remaining = Math.ceil((cd - (Kernel.system.currentTick - last)) / 20)
            player.sendMessage(`\xA7c\xA7l» \xA77Please wait \xA7e${remaining}s \xA77before using this again.`);
            return
        }

        // step 2: anchor node resolution.
        // fetch the coordinate data from the persistent store.
        const home = await HomeStore.getHome(player, name)
        if (!home) {
            player.sendMessage(`\xA7c\xA7l» \xA77Home '${name}' not found.`);
            return
        }

        // step 3: wait time resolution.
        // determines if the player has to stand still before teleporting (combat safety).
        const waitTime = Number(PermissionManager.hasPermission(player, "teleport.wait") ?? 5)

        // step 4: relocation execution.
        // center the player on the block (0.5 offset).
        const targetLocation = { x: home.x + 0.5, y: home.y, z: home.z + 0.5 }

        if (waitTime > 0) {
            // execute a delayed teleport (usually 5s).
            TeleportService.teleportWithWait(player, targetLocation, home.dimension, waitTime);
        } else {
            // execute an instant jump.
            TeleportService.teleport(player, targetLocation, home.dimension);
            player.sendMessage(`\xA7a\xA7l» \xA7fTeleported to home \xA7e${name}\xA7f.`);
        }

        // update the cooldown pointer.
        cooldowns.set(player.id, Kernel.system.currentTick)
    }
}
