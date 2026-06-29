import { SpatialRegistry } from "./SpatialRegistry.js"
import { EconomyRegistry } from "./EconomyRegistry.js"
import { AdminRegistry } from "./AdminRegistry.js"
import { GeneralRegistry } from "./GeneralRegistry.js"


/*
 * MASTER_COMMAND_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handshakes with the individual tiered registries and mass-docks all 
 * active vectors into the CommandRegistry.
 */
export const CommandBootstrap = {
    init(Registry) {
        SpatialRegistry.register(Registry)
        EconomyRegistry.register(Registry)
        AdminRegistry.register(Registry)
        GeneralRegistry.register(Registry)

        
        console.log("[AethelLib] MODULAR_COMMAND_REGISTRY_ACTIVE");
    }
}
