import { system } from "@minecraft/server"
import { Kernel } from "./core/Kernel.js"
import { init as initEarly } from "./bootstrap/early.js"
import { init as initCore } from "./bootstrap/core.js"
import { init as initCommands } from "./bootstrap/commands.js"
import { loadPlugins } from "./plugins/PluginLoader.js"

/**
 * Main Initialization Entry Point
 * Orchestrates the boot sequence of core systems and command registries.
 */

// Phase 0: Early Stage
// Registers registries and command managers to catch startup events
initEarly()
initCommands()

system.run(async () => {
    // Phase 1: Core Boot
    // Initialize data stores, services, and core logic
    initCore()

    // Phase 2: Plugin Induction
    // Load plugin files dynamically
    await loadPlugins()

    // Phase 3: System Finalization
    // Execute plugin initialization logic
    Kernel.bootPlugins()

    console.log("[AethelLib] AethelNexus Core Active | Industrial Architecture Online");
})
