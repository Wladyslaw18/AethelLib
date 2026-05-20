import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_MOMENTUM_TRACKER
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for monitoring and rewarding 
 * combat-momentum. Implements an O(1) volatile memory-map for tracking 
 * sequential entity-terminations within a single session.
 *
 * PHILOSOPHY: Momentum is the force of the empire. Skill-milestones 
 * must be broadcasted to maintain industrial morale and identify 
 * high-performance assets.
 */

const killstreaks = new Map() // VOLATILE_MOMENTUM_REGISTRY
const STREAK_MILESTONE = 5
const CLEANUP_INTERVAL = 12000 // 10-minute industrial maintenance cycle

/* 
 * SYSTEM_BOOTSTRAP_PROTOCOL
 */
export function init() {
    /* 
     * TERMINATION_INTERCEPTION_VECTOR
     * Subscribes to the entityDie event to calibrate momentum-nodes.
     */
    Kernel.world.afterEvents.entityDie.subscribe((event) => {
        const victim = event.deadEntity
        const killer = event.damageSource?.damagingEntity

        if (victim?.typeId === "minecraft:player") {
            if (killer?.typeId === "minecraft:player" && killer.id !== victim.id) {
                handleKill(killer.id, victim.id)
            } else {
                resetKillstreak(victim.id)
            }
        }
    })

    Kernel.system.runInterval(cleanup, CLEANUP_INTERVAL)
}

/* 
 * MOMENTUM_CALIBRATION_PROTOCOL
 * Increments the momentum-node for the killer and resets the victim. 
 * Orchestrates milestone-broadcasts when thresholds are reached.
 */
function handleKill(killerId, victimId) {
    const victimStreak = killstreaks.get(victimId) || 0
    if (victimStreak >= 5) {
        const killer = Kernel.world.getAllPlayers().find(p => p.id === killerId)
        const victim = Kernel.world.getAllPlayers().find(p => p.id === victimId)
        if (killer && victim) {
            Kernel.world.sendMessage(`\u00A77[War_Cry] \u00A7e${killer.name} \u00A77terminated \u00A7e${victim.name}\u00A77's \u00A7c${victimStreak} \u00A77momentum-streak!`)
        }
    }

    const currentStreak = killstreaks.get(killerId) || 0
    const newStreak = currentStreak + 1
    killstreaks.set(killerId, newStreak)

    if (newStreak % STREAK_MILESTONE === 0) {
        broadcastMilestone(killerId, newStreak)
    }
}

/* 
 * MOMENTUM_RESET_PROTOCOL
 */
function resetKillstreak(playerId) {
    killstreaks.set(playerId, 0)
}

/* 
 * MILESTONE_BROADCAST_VECTOR
 * Manifests the visual broadcast for specific momentum-tiers.
 */
function broadcastMilestone(playerId, streak) {
    const player = Kernel.world.getAllPlayers().find(p => p.id === playerId)
    if (!player) return

    let rarity, color, message
    if (streak >= 50) {
        rarity = "ULTRA_LEGENDARY"
        color = "\u00A76\u00A7l"
        message = "is a god of the industrial waste!"
    } else if (streak >= 25) {
        rarity = "LEGENDARY"
        color = "\u00A7d"
        message = "is manifesting extreme combat-dominance!"
    } else if (streak >= 15) {
        rarity = "ELITE"
        color = "\u00A7e"
        message = "is saturating the engagement-buffer!"
    } else {
        rarity = "STABILIZED"
        color = "\u00A7a"
        message = "has achieved a momentum-milestone."
    }

    const broadcast = `${color}[${rarity}] \u00A7f${player.name} ${message} (Streak: ${streak})`
    Kernel.world.getAllPlayers().forEach(p => p.sendMessage(broadcast))
}

/* 
 * MOMENTUM_QUERY_VECTOR
 */
export function getKillstreak(playerId) {
    return killstreaks.get(playerId) || 0
}

/* 
 * REGISTRY_MAINTENANCE_PROTOCOL
 * Purges momentum-nodes for entities no longer present in the 
 * industrial-buffer.
 */
function cleanup() {
    const onlinePlayerIds = new Set(Kernel.world.getAllPlayers().map(p => p.id))
    for (const [playerId] of killstreaks.entries()) {
        if (!onlinePlayerIds.has(playerId)) {
            killstreaks.delete(playerId)
        }
    }
}
