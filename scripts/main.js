/**
 * Main Entry Point - MAX 15 lines. Entry only.
 */

import { world, system } from "@minecraft/server"
import { init as initCore } from "./bootstrap/core.js"
import { init as initCommands } from "./bootstrap/commands.js"

// Initialize everything on first tick
system.run(() => {
    initCore()
    initCommands()
    console.log("§2[AethelLib] Titanium Framework Fully Initialized v2.20.2")
})

