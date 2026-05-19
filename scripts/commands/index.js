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
        // if this registry catches fire, don't let it burn down the economy.
        try {
            SpatialRegistry.register(Registry)
        } catch (e) {
            console.error("[CommandBootstrap] CRITICAL_REGISTRY_CRASH [Spatial]:", e)
        }

        // register money-related commands (balance, pay, etc).
        try {
            EconomyRegistry.register(Registry)
        } catch (e) {
            console.error("[CommandBootstrap] CRITICAL_REGISTRY_CRASH [Economy]:", e)
        }

        // register staff/admin tools (mute, kick, etc).
        try {
            AdminRegistry.register(Registry)
        } catch (e) {
            console.error("[CommandBootstrap] CRITICAL_REGISTRY_CRASH [Admin]:", e)
        }

        // register miscellaneous utility commands (help, discord, etc).
        try {
            GeneralRegistry.register(Registry)
        } catch (e) {
            console.error("[CommandBootstrap] CRITICAL_REGISTRY_CRASH [General]:", e)
        }

        // log that we finished the handshake.
        console.log("[AethelLib] command registry handshake complete.");
    }
}
