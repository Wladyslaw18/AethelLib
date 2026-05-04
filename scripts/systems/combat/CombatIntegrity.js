/**
 * Combat Integrity Suite - Prevent combat logging and reward survival
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { Kernel } from "../../core/Kernel.js"

// Combat state tracking (Identity Map cache)
const combatState = new Map()
const COMBAT_DURATION = 200 // 10 seconds (200 ticks)

/**
 * Initialize combat integrity system
 */
export function init() {
    // Track combat start
    Kernel.world.afterEvents.entityHurt.subscribe((event) => {
        const hurtEntity = event.hurtEntity
        const damagingEntity = event.damageSource?.damagingEntity

        // Only track player combat
        if (hurtEntity?.typeId === "minecraft:player") {
            const currentTick = Kernel.system.currentTick
            combatState.set(hurtEntity.id, currentTick + COMBAT_DURATION)

            // Bug 1: Tag attacker if also a player
            if (damagingEntity?.typeId === "minecraft:player") {
                combatState.set(damagingEntity.id, currentTick + COMBAT_DURATION)
            }

            // Bug 5: Notify both participants
            Kernel.system.run(() => {
                if (hurtEntity.isValid) {
                    hurtEntity.onScreenDisplay.setActionBar("§c⚔ Combat Tagged! Don't log out.")
                }
                if (damagingEntity?.isValid) {
                    damagingEntity.onScreenDisplay.setActionBar("§c⚔ Combat Tagged! Don't log out.")
                }
            })
        }
    })

    // Track player leaving (combat logging detection)
    Kernel.world.afterEvents.playerLeave.subscribe((event) => {
        const playerId = event.playerId
        const combatTick = combatState.get(playerId)
        const currentTick = system.currentTick

        // Check if player is in combat and leaving early
        if (combatTick && currentTick < combatTick) {
            // Set death debt flag
            const PlayerStore = Kernel.get("playerStore")
            PlayerStore.set(playerId, "deathDebt", true)
            combatState.delete(playerId)
        }
    })

    // Handle player join with death debt punishment
    Kernel.world.afterEvents.playerSpawn.subscribe((event) => {
        if (!event.initialSpawn) return

        const player = event.player
        const PlayerStore = Kernel.get("playerStore")
        const deathDebt = PlayerStore.get(player.id, "deathDebt")

        if (deathDebt === true) {
            // Bug 4: Delay punishment to ensure full spawn
            Kernel.system.runTimeout(() => {
                if (!player.isValid) return

                try {
                    // Clear inventory
                    const inventory = player.getComponent("minecraft:inventory")
                    if (inventory?.container) {
                        inventory.container.clearAll()
                    }

                    // Kill player
                    player.kill()

                    // Clear debt
                    const PlayerStore = Kernel.get("playerStore")
                    PlayerStore.set(player.id, "deathDebt", false)

                    player.sendMessage("§cCombat logging detected! Inventory cleared and respawned.")
                } catch (error) {
                    console.error(`CombatIntegrity: Failed to punish combat logger ${player.id}:`, error)
                }
            }, 20)
        }
    })

    // Schedule cleanup interval
    Kernel.system.runInterval(cleanup, 200)
}

/**
 * Check if player is in combat
 * @param {string} playerId - Player UUID
 * @returns {boolean} Whether player is in combat
 */
export function isInCombat(playerId) {
    const combatTick = combatState.get(playerId)
    return combatTick && Kernel.system.currentTick < combatTick
}

/**
 * Get remaining combat time
 * @param {string} playerId - Player UUID
 * @returns {number} Remaining ticks in combat
 */
export function getCombatTime(playerId) {
    const combatTick = combatState.get(playerId)
    if (!combatTick) return 0
    return Math.max(0, combatTick - Kernel.system.currentTick)
}

/**
 * Clean up expired combat states
 */
export function cleanup() {
    const currentTick = system.currentTick
    for (const [playerId, combatTick] of combatState.entries()) {
        if (currentTick >= combatTick) {
            combatState.delete(playerId)
        }
    }
}

