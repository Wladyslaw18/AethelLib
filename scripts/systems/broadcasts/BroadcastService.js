/**
 * Broadcast Service - DOD Refactor with Date.now() timer
 * Performance: Check nextBroadcastTick once every 20 ticks (1s) rather than every tick
 */
import { Kernel } from "../../core/Kernel.js";


import { BroadcastStore } from "./BroadcastStore.js"
import { TickScheduler } from "../../core/scheduler/TickScheduler.js"

export class BroadcastService {
    static #running = false
    static #ta = null
    static #nextBroadcastTime = 0
    static #stats = {
        totalBroadcasts: 0,
        lastBroadcastTime: 0,
        averageInterval: 0
    }

    /**
     * Initialize the broadcast service
     */
    static init() {
        if (this.#running) return

        this.#running = true
        this.#scheduleNextBroadcast()
        this.#startTicker()

        console.log("BroadcastService: Initialized")
    }

    /**
     * Stop the broadcast service
     */
    static stop() {
        if (!this.#running) return

        this.#running = false
        if (this.#ta) {
            TickScheduler.cancel(this.#ta)
            this.#ta = null
        }

        console.log("BroadcastService: Stopped")
    }

    /**
     * Start the performance ticker (checks every 20 ticks)
     */
    static #startTicker() {
        this.#ta = TickScheduler.schedule(() => {
            if (!this.#running) return

            const now = Date.now()
            if (now >= this.#nextBroadcastTime) {
                this.#broadcastMessage()
                this.#scheduleNextBroadcast()
            }
        }, 20, {
            name: "BroadcastTicker",
            condition: () => this.#running && Kernel.world.getAllPlayers().length > 0
        })
    }

    /**
     * Schedule next broadcast based on current interval
     */
    static #scheduleNextBroadcast() {
        const interval = BroadcastStore.getInterval() * 1000 // Convert to milliseconds
        this.#nextBroadcastTime = Date.now() + interval
    }

    /**
     * Roll rarity based on weighted chances
     * @returns {string} Selected rarity tier
     */
    static #rollRarity() {
        const roll = Math.random()
        if (roll <= 0.02) return "legendary" // 2% Polish Proverbs
        if (roll <= 0.10) return "rare"
        if (roll <= 0.30) return "uncommon"
        return "common"
    }

    /**
     * Get a random message from a tier
     * @param {string} tier - Rarity tier
     * @returns {string} Random message
     */
    static #getRandomMessage(tier) {
        const messages = BroadcastStore.getMessages(tier)
        if (!messages || messages.length === 0) {
            // Fallback to common if tier is empty
            const commonMessages = BroadcastStore.getMessages("common")
            return commonMessages[Math.floor(Math.random() * commonMessages.length)] || "\xA77Broadcast message unavailable"
        }

        return messages[Math.floor(Math.random() * messages.length)]
    }

    /**
     * Broadcast a message to all players
     */
    static #broadcastMessage() {
        try {
            const rarity = this.#rollRarity()
            const message = this.#getRandomMessage(rarity)
            const players = Kernel.world.getAllPlayers()

            // Send to all online players
            for (const player of players) {
                try {
                    player.sendMessage(message)
                } catch (error) {
                    console.warn(`BroadcastService: Failed to send message to ${player.name}:`, error)
                }
            }

            // Update statistics
            this.#updateStats()
            
            console.log(`BroadcastService: Sent ${rarity} message to ${players.length} players`)
        } catch (error) {
            console.error("BroadcastService: Failed to broadcast message:", error)
        }
    }

    /**
     * Update broadcast statistics
     */
    static #updateStats() {
        const now = Date.now()
        const prev = this.#stats.lastBroadcastTime  // capture BEFORE overwriting
        this.#stats.totalBroadcasts++
        this.#stats.lastBroadcastTime = now

        if (this.#stats.totalBroadcasts > 1 && prev > 0) {
            const interval = now - prev
            this.#stats.averageInterval = Math.round(
                (this.#stats.averageInterval * (this.#stats.totalBroadcasts - 1) + interval) /
                this.#stats.totalBroadcasts
            )
        }
    }

    /**
     * Force broadcast a message immediately
     * @param {string} message - Message to broadcast
     */
    static broadcastNow(message) {
        if (!message || typeof message !== "string") return

        const players = Kernel.world.getAllPlayers()
        for (const player of players) {
            try {
                player.sendMessage(message)
            } catch (error) {
                console.warn(`BroadcastService: Failed to send immediate message to ${player.name}:`, error)
            }
        }

        this.#updateStats()
    }

    /**
     * Test broadcast with specific rarity
     * @param {string} rarity - Rarity tier to test
     * @param {import("@minecraft/server").Player} player - Specific player to test on (optional)
     */
    static testBroadcast(rarity, player = null) {
        const message = this.#getRandomMessage(rarity)
        const targetPlayers = player ? [player] : Kernel.world.getAllPlayers()

        for (const targetPlayer of targetPlayers) {
            try {
                targetPlayer.sendMessage(`\xA76[TEST] ${message}`)
            } catch (error) {
                console.warn(`BroadcastService: Failed to send test to ${targetPlayer.name}:`, error)
            }
        }
    }

    /**
     * Get service statistics
     * @returns {Object} Statistics
     */
    static getStats() {
        return {
            ...this.#stats,
            running: this.#running,
            nextBroadcastTime: this.#nextBroadcastTime,
            timeUntilNext: Math.max(0, this.#nextBroadcastTime - Date.now()),
            currentInterval: BroadcastStore.getInterval()
        }
    }

    /**
     * Reset statistics
     */
    static resetStats() {
        this.#stats = {
            totalBroadcasts: 0,
            lastBroadcastTime: 0,
            averageInterval: 0
        }
    }

    /**
     * Get time until next broadcast in human-readable format
     * @returns {string} Time until next broadcast
     */
    static getTimeUntilNext() {
        const ms = Math.max(0, this.#nextBroadcastTime - Date.now())
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`
        }
        return `${seconds}s`
    }

    /**
     * Check if service is running
     * @returns {boolean} Whether service is running
     */
    static isRunning() {
        return this.#running
    }

    /**
     * Get current configuration
     * @returns {Object} Current broadcast configuration
     */
    static getConfig() {
        return BroadcastStore.getConfig()
    }

    /**
     * Update configuration and reschedule if needed
     * @param {Object} config - New configuration
     */
    static updateConfig(config) {
        const success = BroadcastStore.setConfig(config)
        if (success && this.#running) {
            this.#scheduleNextBroadcast()
        }
        return success
    }
}

// Export singleton instance for easy access
export const BroadcastServiceInstance = BroadcastService

