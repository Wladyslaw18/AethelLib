import { system } from "@minecraft/server"
import { Kernel } from "./core/Kernel.js"
import { init as initCore } from "./bootstrap/core.js"
import { init as initCommands } from "./bootstrap/commands.js"
import "./plugins/PluginLoader.js"

/**
 * Main Initialization Entry Point
 * Orchestrates the boot sequence of core systems and command registries.
 */

// Early initialization for startup events
initCore(true)
initCommands()

system.run(() => {
    // Full system initialization when world state is stable
    initCore()
    Kernel.bootPlugins()
    console.log("[AethelLib] AethelNexus Core Active");
})


