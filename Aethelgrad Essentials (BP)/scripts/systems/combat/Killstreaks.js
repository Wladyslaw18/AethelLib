/**
 * Killstreaks System - Reward high-skill survival
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { Kernel } from "../../core/Kernel.js"

// Killstreak tracking (Identity Map cache)
const killstreaks = new Map()
const STREAK_MILESTONE = 5
const CLEANUP_INTERVAL = 12000 // 10 minutes in ticks

/**
 * Initialize killstreak system
 */
export function init() {
    // Track kills and reset on death
    Kernel.world.afterEvents.entityDie.subscribe((event) => {
        const victim = event.deadEntity
        const killer = event.damageSource?.damagingEntity

        // Bug 3: Self-kill guard
        if (victim?.typeId === "minecraft:player") {
            if (killer?.typeId === "minecraft:player" && killer.id !== victim.id) {
                handleKill(killer.id, victim.id)
            } else {
                resetKillstreak(victim.id)
            }
        }
    })

    // Periodic cleanup
    Kernel.system.runInterval(cleanup, CLEANUP_INTERVAL)
}

/**
 * Handle a kill event
 * @param {string} killerId - Killer UUID
 * @param {string} victimId - Victim UUID
 */
function handleKill(killerId, victimId) {
    // Bug 2: Check victim streak for ended broadcast
    const victimStreak = killstreaks.get(victimId) || 0
    if (victimStreak >= 5) {
        const killer = Kernel.world.getAllPlayers().find(p => p.id === killerId)
        const victim = Kernel.world.getAllPlayers().find(p => p.id === victimId)
        if (killer && victim) {
            Kernel.world.sendMessage(`§7[War Cry] §e${killer.name} §7ended §e${victim.name}§7's §c${victimStreak} §7kill streak!`)
        }
    }

    const currentStreak = killstreaks.get(killerId) || 0
    const newStreak = currentStreak + 1

    // Update cache
    killstreaks.set(killerId, newStreak)

    // Bug 1: Remove useless persistence - streaks are session-only
    // debouncedWrite(killerId, "killstreak", newStreak)

    // Check for milestone
    if (newStreak % STREAK_MILESTONE === 0) {
        broadcastMilestone(killerId, newStreak)
    }
}

/**
 * Reset killstreak for player
 * @param {string} playerId - Player UUID
 */
function resetKillstreak(playerId) {
    killstreaks.set(playerId, 0)
    // Bug 1: Remove useless persistence - streaks are session-only
    // debouncedWrite(playerId, "killstreak", 0)
}

/**
 * Broadcast milestone message with rarity tier
 * @param {string} playerId - Player UUID
 * @param {number} streak - Current killstreak
 */
function broadcastMilestone(playerId, streak) {
    const player = Kernel.world.getAllPlayers().find(p => p.id === playerId)
    if (!player) return

    // Rarity tiers based on streak count
    let rarity, color, message

    if (streak >= 50) {
        rarity = "Legendary"
        color = "§6§l"
        message = `is an absolute warrior with a ${streak} kill streak!`
    } else if (streak >= 25) {
        rarity = "Rare"
        color = "§d"
        message = `is on fire with a ${streak} kill streak!`
    } else if (streak >= 15) {
        rarity = "Uncommon"
        color = "§e"
        message = `is dominating with a ${streak} kill streak!`
    } else {
        rarity = "Common"
        color = "§a"
        message = `is on a ${streak} kill streak!`
    }

    // Broadcast to all players
    const broadcast = `${color}[${rarity}] §f${player.name} ${message}`
    Kernel.world.getAllPlayers().forEach(p => p.sendMessage(broadcast))
}

/**
 * Debounced write to PlayerStore
 * @param {string} playerId - Player UUID
 * @param {string} key - Store key
 * @param {*} value - Value to store
 */
const debouncedWriteCache = new Map()
const DEBOUNCE_TIME = 40 // 2 seconds

function debouncedWrite(playerId, key, value) {
    const cacheKey = `${playerId}:${key}`
    const existing = debouncedWriteCache.get(cacheKey)

    // Clear existing timeout
    if (existing) {
        Kernel.system.clearRun(existing)
    }

    // Set new timeout
    const timeoutId = Kernel.system.runTimeout(() => {
        const PlayerStore = Kernel.get("playerStore")
        PlayerStore.set(playerId, key, value)
        debouncedWriteCache.delete(cacheKey)
    }, DEBOUNCE_TIME)

    debouncedWriteCache.set(cacheKey, timeoutId)
}

/**
 * Get player's current killstreak
 * @param {string} playerId - Player UUID
 * @returns {number} Current killstreak
 */
export function getKillstreak(playerId) {
    return killstreaks.get(playerId) || 0
}

/**
 * Clean up stale killstreak data
 */
function cleanup() {
    const onlinePlayerIds = new Set(Kernel.world.getAllPlayers().map(p => p.id))

    for (const [playerId] of killstreaks.entries()) {
        if (!onlinePlayerIds.has(playerId)) {
            killstreaks.delete(playerId)
        }
    }
}
