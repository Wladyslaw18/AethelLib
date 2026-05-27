import { Kernel } from "../core/Kernel.js";
import { init as FloatingTextService } from "../systems/floatingtext/FloatingTextService.js"
import { BanknoteHandler } from "../systems/banknote/BanknoteHandler.js"
import { init as ChestShopHandler } from "../events/ChestShopHandler.js"
import { init as CompassHandler } from "../events/CompassHandler.js"
import { init as PlaceholderProvider } from "../systems/placeholders/PlaceholderProvider.js"
import { init as PlaceholderScheduler } from "../systems/placeholders/PlaceholderScheduler.js"
import { init as ScoreboardMirror } from "../systems/economy/ScoreboardMirror.js"
import { startMarketRecoveryJob } from "../commands/shop/ShopPrices.js"

/*
 * BACKGROUND_SERVICE_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * This module manages the staggered initialization of secondary background 
 * workers. We use a delayed-execution strategy (Kernel.system.runTimeout) to 
 * prevent a massive CPU spike during the initial server bootstrap.
 *
 * Each service is given a dedicated time-slice to initialize its internal 
 * state and bind its event listeners.
 */

let servicesInitialized = false

/*
 * SERVICE_STAGGERED_INITIALIZATION_LOOP
 * ----------------------------------------------------------------------------
 * Sequentially triggers the bootstrap of event handlers and background tasks. 
 * We use 100-tick intervals (approx 5 seconds) to spread the load across 
 * the startup phase.
 */
export const initializeServices = () => {
    if (servicesInitialized) return
    servicesInitialized = true

    /* 
     * SERVICE_TIME_SLICING
     * Allocates specific tick-ranges for service initialization to 
     * maintain TPS stability during startup.
     */
    Kernel.system.runTimeout(() => FloatingTextService(), 400)   // FT_SERVICE_BOOT
    Kernel.system.runTimeout(() => ChestShopHandler(), 500)      // COMMERCE_HANDLER_BOOT
    Kernel.system.runTimeout(() => CompassHandler(), 600)        // NAVIGATION_HANDLER_BOOT
    Kernel.system.runTimeout(() => PlaceholderProvider(), 700)   // VARIABLE_REGISTRY_BOOT
    Kernel.system.runTimeout(() => PlaceholderScheduler(), 800)  // UPDATE_TICK_BOOT
    Kernel.system.runTimeout(() => ScoreboardMirror(), 900)      // DATA_MIRROR_BOOT
    Kernel.system.runTimeout(() => startMarketRecoveryJob(), 1000) // MARKET_DECAY_BOOT

    /*
     * IMMEDIATE_ACTION_HANDLERS
     * These handlers must be active instantly to catch early player 
     * interactions with physical bank artifacts.
     */
    BanknoteHandler.init()

    console.log("[AethelLib] BACKGROUND_SERVICES_ORCHESTRATED");
}
