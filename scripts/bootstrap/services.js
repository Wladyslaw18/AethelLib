/**
 * Services Bootstrap - Initialize background services
 * @/* SINGULARITY */ Aethelgrad
 * @version 1.0.0
 */

// Service imports will go here
// import { BroadcastService } from "../services/BroadcastService.js"
// import { CleanerService } from "../services/CleanerService.js"
// import { CompassService } from "../services/CompassService.js"
import { init as FloatingTextService } from "../systems/floatingtext/FloatingTextService.js"
import { BanknoteHandler } from "../systems/banknote/BanknoteHandler.js"

let servicesInitialized = false

/**
 * Initialize all background services
 * @returns {void}
 */
export const initializeServices = () => {
    if (servicesInitialized) return
    servicesInitialized = true

    console.log("§2[Aethelgrad Essentials] Initializing services...")

    // Services will be initialized here with delayed startup
    // system.runTimeout(() => BroadcastService.initialize(), 100)
    // system.runTimeout(() => CleanerService.initialize(), 200)
    // system.runTimeout(() => CompassService.initialize(), 300)
    system.runTimeout(() => FloatingTextService(), 400)

    // Initialize banknote handler
    BanknoteHandler.init()

    console.log("§2[Aethelgrad Essentials] All services initialized")
}

