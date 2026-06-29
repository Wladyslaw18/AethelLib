/**
 * Early-boot bootstrap logic
 * Registers core registries and managers without pulling in heavy system dependencies.
 * This prevents circular dependency loops during Phase 0.
 */

import { Kernel } from "../core/Kernel.js"
import { CommandRegistry } from "../commands/base/CommandRegistry.js"
import { CommandManager } from "../core/commands/CommandManager.js"

export function init() {
    // Register registry and manager early to catch startup events
    Kernel.register("commandRegistry", CommandRegistry)
    Kernel.register("commandManager",  CommandManager)
    
    // Initialize CommandManager to subscribe to startup events
    CommandManager.init()
    
    console.log("[Kernel] Phase 0 Early-Boot Handshake Complete.");
}
