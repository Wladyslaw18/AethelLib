/**
 * Systems Bootstrap - Initialize all game systems
 * @/* NEXUS */ Aethelgrad
 * @version 1.0.0
 */

// System imports
import { init as combatIntegrity } from "../systems/combat/CombatIntegrity.js"
import { init as killstreaks } from "../systems/combat/Killstreaks.js"
// import { EconomySystem } from "../systems/economy/EconomySystem.js"
// import { TeleportSystem } from "../systems/teleport/TeleportSystem.js"
// import { CombatSystem } from "../systems/combat/CombatSystem.js"
// import { LandSystem } from "../systems/land/LandSystem.js"
// import { SocialSystem } from "../systems/social/SocialSystem.js"

let systemsInitialized = false

/**
 * Initialize all game systems
 * @returns {void}
 */
export const initializeSystems = () => {
    if (systemsInitialized) return

    console.log("§2[Aethelgrad Essentials] Initializing systems...")

    // Initialize Combat Integrity Suite
    combatIntegrity()
    killstreaks()
    console.log("§2[Aethelgrad Essentials] Combat Integrity Suite initialized")

    // Systems will be initialized here in order
    // await EconomySystem.initialize()
    // await TeleportSystem.initialize()
    // await CombatSystem.initialize()
    // await LandSystem.initialize()
    // await SocialSystem.initialize()

    systemsInitialized = true
    console.log("§2[Aethelgrad Essentials] All systems initialized")
}

