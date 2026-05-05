/*
 * GAME_SYSTEMS_BOOTSTRAP_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * This module is responsible for triggering the initialization of high-level 
 * game logic systems. We handle the activation of the combat-integrity 
 * filters, killstreak trackers, and land-protection protocols.
 *
 * All systems here are critical for gameplay stability and must be active 
 * before the first player interaction.
 */

import { init as combatIntegrity } from "../systems/combat/CombatIntegrity.js"
import { init as killstreaks } from "../systems/combat/Killstreaks.js"
import { init as landProtection } from "../systems/protection/ClaimService.js"

let systemsInitialized = false

/*
 * SYSTEM_ACTIVATION_LOOP
 * ----------------------------------------------------------------------------
 * Synchronously triggers the startup of foundational game systems. 
 * This ensures that protections and trackers are hot-swapped into the 
 * engine before the first tick.
 */
export const initializeSystems = () => {
    if (systemsInitialized) return
    systemsInitialized = true

    /* 
     * COMBAT_AND_PROTECTION_SUITES
     * ----------------------------------------------------------------------------
     * Handshakes with the combat and spatial-protection modules to bind 
     * their respective event listeners.
     */
    combatIntegrity()  // ANTI_CHEAT_FILTER
    killstreaks()      // STREAK_TRACKING_MODULE
    landProtection()   // SPATIAL_PROTECTION_ENGINE

    console.log("[AethelLib] GAME_SYSTEMS_ONLINE");
}
