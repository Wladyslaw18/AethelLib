
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

export const SpatialRegistry = {
    register(Registry) {
        Registry.register("sethome", SetHomeCommand)
        Registry.register("home", GoHomeCommand)
        Registry.register("delhome", DelHomeCommand)
        Registry.register("listhome", ListHomeCommand)
        Registry.register("setwarp", SetWarpCommand)
        Registry.register("warp", WarpCommand)
        Registry.register("delwarp", DelWarpCommand)
        Registry.register("listwarp", ListWarpCommand)
        Registry.register("spawn", SpawnCommand)
        Registry.register("rtp", RTPCommand)
        Registry.register("back", BackCommand)
        Registry.register("tpa", TPACommand)
        Registry.register("tpahere", TPAHereCommand)
        Registry.register("tpaccept", TPAcceptCommand)
        Registry.register("tpacancel", TPACancelCommand)
        Registry.register("tpasetting", TPASettingCommand)
    }
}
