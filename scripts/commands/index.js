import { SpatialRegistry } from "./SpatialRegistry.js"
import { EconomyRegistry } from "./EconomyRegistry.js"
import { AdminRegistry } from "./AdminRegistry.js"
import { GeneralRegistry } from "./GeneralRegistry.js"

// ----------------------------------------------------------------------------
// | object: CommandBootstrap                                                 |
// | master orchestrator for registering all command modules.                  |
// | coordinates the individual sub-registries and docks them into the kernel. |
// ----------------------------------------------------------------------------
export const CommandBootstrap = {
    // ----------------------------------------------------------------------------
    // | method: init                                                             |
    // | takes the core registry object and feeds it every command group.         |
    // ----------------------------------------------------------------------------
    init(Registry) {
        // register movement and spatial commands (tp, home, etc).
        SpatialRegistry.register(Registry)
        // register money-related commands (balance, pay, etc).
        EconomyRegistry.register(Registry)
        // register staff/admin tools (mute, kick, etc).
        AdminRegistry.register(Registry)
        // register miscellaneous utility commands (help, discord, etc).
        GeneralRegistry.register(Registry)

        // log that we finished the handshake.
        console.log("[AethelLib] command registry handshake complete.");
    }
}
