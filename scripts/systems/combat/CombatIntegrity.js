import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_THREAT_INTEGRITY_SUITE
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for monitoring and enforcing 
 * engagement-integrity. Implements an O(1) volatile memory-map for 
 * tracking active combat-tags and a persistent debt-manifest for 
 * penalizing combat-logging events.
 *
 * PHILOSOPHY: Desertion is a capital offense. If an entity severs its 
 * connection during an active engagement, its assets must be liquidated 
 * and its state reset upon re-initialization.
 */

const combatState = new Map() // VOLATILE_ENGAGEMENT_REGISTRY
const COMBAT_DURATION = 200 // INDUSTRIAL_TAG_TTL (10 seconds)

/* 
 * SYSTEM_BOOTSTRAP_PROTOCOL
 */
export function init() {
    /* 
     * ENGAGEMENT_INTERCEPTION_VECTOR
     * Subscribes to the entityHurt event to tag participants in 
     * industrial-scale combat.
     */
    Kernel.world.afterEvents.entityHurt.subscribe((event) => {
        const hurtEntity = event.hurtEntity
        const damagingEntity = event.damageSource?.damagingEntity

        if (hurtEntity?.typeId === "minecraft:player") {
            const currentTick = Kernel.system.currentTick
            combatState.set(hurtEntity.id, currentTick + COMBAT_DURATION)

            if (damagingEntity?.typeId === "minecraft:player") {
                combatState.set(damagingEntity.id, currentTick + COMBAT_DURATION)
            }

            Kernel.system.run(() => {
                if (hurtEntity.isValid && hurtEntity.typeId === "minecraft:player") {
                    /** @type {import("@minecraft/server").Player} */ (hurtEntity).onScreenDisplay.setActionBar("§c[ENGAGEMENT_DETECTED] STATUS: TAGGED")
                }
                if (damagingEntity?.isValid && damagingEntity.typeId === "minecraft:player") {
                    /** @type {import("@minecraft/server").Player} */ (damagingEntity).onScreenDisplay.setActionBar("§c[ENGAGEMENT_DETECTED] STATUS: TAGGED")
                }
            })
        }
    })

    /* 
     * DESERTION_DETECTION_VECTOR
     * Monitors the playerLeave event. If an entity de-initializes while 
     * tagged, its UUID is added to the death-debt manifest.
     */
    Kernel.world.afterEvents.playerLeave.subscribe((event) => {
        const playerId = event.playerId
        const combatTick = combatState.get(playerId)
        const currentTick = Kernel.system.currentTick

        if (combatTick && currentTick < combatTick) {
            const PlayerStore = Kernel.get("playerStore")
            PlayerStore.set({ id: playerId }, "deathDebt", true)
            combatState.delete(playerId)
        }
    })

    /* 
     * DEBT_SETTLEMENT_VECTOR
     * Orchestrates the liquidation of assets for entities re-initializing 
     * with an active death-debt.
     */
    Kernel.world.afterEvents.playerSpawn.subscribe((event) => {
        if (!event.initialSpawn) return

        const player = event.player
        const PlayerStore = Kernel.get("playerStore")
        const deathDebt = PlayerStore.get(player, "deathDebt")

        if (deathDebt === true) {
            Kernel.system.runTimeout(() => {
                if (!player.isValid) return

                try {
                    const inventory = player.getComponent("minecraft:inventory")
                    if (inventory?.container) {
                        inventory.container.clearAll()
                    }

                    player.kill()

                    PlayerStore.set(player, "deathDebt", false)
                    player.sendMessage("§c[INDUSTRIAL_PENALTY] COMBAT_LOGGING_DETECTED: ASSETS_LIQUIDATED");
                } catch (error) {
                    console.error(`[CombatIntegrity] PENALTY_ORCHESTRATION_FAILURE for ${player.id}:`, error)
                }
            }, 20)
        }
    })

    Kernel.system.runInterval(cleanup, 200)
}

/* 
 * ENGAGEMENT_STATUS_QUERY
 */
export function isInCombat(playerId) {
    const combatTick = combatState.get(playerId)
    return combatTick && Kernel.system.currentTick < combatTick
}

/* 
 * TEMPORAL_ENGAGEMENT_METRIC
 */
export function getCombatTime(playerId) {
    const combatTick = combatState.get(playerId)
    if (!combatTick) return 0
    return Math.max(0, combatTick - Kernel.system.currentTick)
}

/* 
 * REGISTRY_MAINTENANCE_PROTOCOL
 * Decommissions expired engagement nodes from the volatile buffer.
 */
export function cleanup() {
    const currentTick = Kernel.system.currentTick
    for (const [playerId, combatTick] of combatState.entries()) {
        if (currentTick >= combatTick) {
            combatState.delete(playerId)
        }
    }
}
