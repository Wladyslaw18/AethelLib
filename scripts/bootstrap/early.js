/**
 * Early-boot bootstrap logic
 * Registers core registries and managers without pulling in heavy system dependencies.
 * This prevents circular dependency loops during Phase 0.
 */

import { Kernel } from "../core/Kernel.js"
import { CommandRegistry } from "../commands/base/CommandRegistry.js"
import { CommandManager } from "../core/commands/CommandManager.js"
import { registerShopEnums } from "../commands/shop/ShopAutocomplete.js"

export function init() {
    // Register registry and manager early to catch startup events
    Kernel.register("commandRegistry", CommandRegistry)
    Kernel.register("commandManager",  CommandManager)
    
    // Initialize CommandManager to subscribe to startup events
    CommandManager.init()
    
    // Register custom shop autocomplete enums before command node bindings
    registerShopEnums()
    
    console.log(" ");
    console.log("\u00A7b   __ _      _   _          _ _     _     ");
    console.log("\u00A7b  / _` | ___| |_| |__   ___| | |   (_)__ _ ");
    console.log("\u00A7b  \\__, |/ _ \\ __| '_ \\ / _ \\ | |   | / _` |");
    console.log("\u00A7b  |___/ \\___|\\__|_| |_|\\___|_|_|___|_\\__, |");
    console.log("\u00A7b                                     |___/ ");
    console.log("\u00A7e      \u00A7l\u2605 1,000 CurseForge Downloads! \u2605");
    console.log(" ");
    console.log("[Kernel] Phase 0 Early-Boot Handshake Complete.");
}
