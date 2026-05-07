import { Kernel } from "../core/Kernel.js"
import { CommandBootstrap } from "../commands/index.js"

/*
 * COMMAND_STAGING_MANIFEST (MODULAR_DECOMPOSITION)
 * ----------------------------------------------------------------------------
 * This module is now a high-performance proxy for the Modular Command Registry. 
 * Orchestrates the handshakes between the Kernel and the tiered command-nodes.
 */

let initialized = false

export function init() {
    if (initialized) return
    initialized = true

    const CommandRegistry = Kernel.get("commandRegistry")
    const CommandManager = Kernel.get("commandManager")

    if (!CommandRegistry || !CommandManager) {
        console.error("[CommandBootstrap] FATAL: Service locator failed to resolve command-nexus.");
        return;
    }

    /* MODULAR_HANDSHAKE_SEQUENCE */
    CommandBootstrap.init(CommandRegistry)

    /* GHOST_INTERPRETER_SYNCHRONIZATION */
    CommandManager.refreshAliases()
    
    /* KERNEL_FINALIZATION */

    console.log("[AethelLib] COMMAND_BOOTSTRAP_COMPLETE | Vectors Loaded: " + CommandRegistry.getAll().length);
}
