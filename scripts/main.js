import { system } from "@minecraft/server"
import { init as initCore } from "./bootstrap/core.js"
import { init as initCommands } from "./bootstrap/commands.js"

/*
 * INDUSTRIAL_KERNEL_IGNITION_VECTOR
 * ----------------------------------------------------------------------------
 * The primary entry-node for the Titanium Framework. Orchestrates the 
 * sequential initialization of core-subsystems and command-registries 
 * on the first temporal tick.
 *
 * PHILOSOPHY: Start fast. Stay stable. Initialized modules define the 
 * operational capacity of the server.
 */
system.run(() => {
    initCore()
    initCommands()
    console.log("[AethelLib] TITANIUM_KERNEL_ACTIVE_V2.20.2");
})
