import { SetHomeCommand } from "./teleport/SetHomeCommand.js"
import { GoHomeCommand } from "./teleport/GoHomeCommand.js"
import { DelHomeCommand } from "./teleport/DelHomeCommand.js"
import { ListHomeCommand } from "./teleport/ListHomeCommand.js"
import { SetWarpCommand } from "./teleport/SetWarpCommand.js"
import { WarpCommand } from "./teleport/WarpCommand.js"
import { DelWarpCommand } from "./teleport/DelWarpCommand.js"
import { ListWarpCommand } from "./teleport/ListWarpCommand.js"
import { SpawnCommand } from "./teleport/SpawnCommand.js"
import { RTPCommand } from "./general/RTPCommand.js"
import { BackCommand } from "./general/BackCommand.js"
import { TPACommand } from "./tpa/TPACommand.js"
import { TPAHereCommand } from "./tpa/TPAHereCommand.js"
import { TPAcceptCommand } from "./tpa/TPAcceptCommand.js"
import { TPACancelCommand } from "./tpa/TPACancelCommand.js"
import { TPASettingCommand } from "./tpa/TPASettingCommand.js"

// ----------------------------------------------------------------------------
// | object: SpatialRegistry                                                  |
// | handles registration for movement, teleportation, and location commands.  |
// ----------------------------------------------------------------------------
export const SpatialRegistry = {
    // ----------------------------------------------------------------------------
    // | method: register                                                         |
    // | pushes command definitions into the core registry.                       |
    // ----------------------------------------------------------------------------
    register(Registry) {
        // ----------------------------------------------------------------------------
        // | Home System                                                              |
        // ----------------------------------------------------------------------------
        
        // save a personal waypoint.
        Registry.register("sethome", SetHomeCommand)
        // teleport to a personal waypoint.
        Registry.register("home", GoHomeCommand)
        // remove a personal waypoint.
        Registry.register("delhome", DelHomeCommand)
        // list all saved personal waypoints.
        Registry.register("listhome", ListHomeCommand)

        // ----------------------------------------------------------------------------
        // | Warp System                                                              |
        // ----------------------------------------------------------------------------
        
        // save a global waypoint (staff only).
        Registry.register("setwarp", SetWarpCommand)
        // teleport to a global waypoint.
        Registry.register("warp", WarpCommand)
        // remove a global waypoint.
        Registry.register("delwarp", DelWarpCommand)
        // list all available global waypoints.
        Registry.register("listwarp", ListWarpCommand)

        // ----------------------------------------------------------------------------
        // | Miscellaneous Movement                                                   |
        // ----------------------------------------------------------------------------
        
        // return to the world spawn point.
        Registry.register("spawn", SpawnCommand)
        // random teleport to a new location.
        Registry.register("rtp", RTPCommand)
        // return to the previous location before a teleport.
        Registry.register("back", BackCommand)

        // ----------------------------------------------------------------------------
        // | TPA (Request) System                                                     |
        // ----------------------------------------------------------------------------
        
        // request to teleport to another player.
        Registry.register("tpa", TPACommand)
        // request another player teleports to you.
        Registry.register("tpahere", TPAHereCommand)
        // accept an incoming request.
        Registry.register("tpaccept", TPAcceptCommand)
        // cancel an outgoing request.
        Registry.register("tpacancel", TPACancelCommand)
        // toggle teleportation preferences.
        Registry.register("tpasetting", TPASettingCommand)
    }
}
