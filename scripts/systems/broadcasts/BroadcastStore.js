/**
 * Broadcast Store - Wrapper for WorldStore with broadcast-specific operations
 * Persists current message pools and timing interval to ae:broadcast_config
 */

import { WorldStore } from "../../core/store/WorldStore.js"
import { BroadcastData } from "./BroadcastData.js"

export class BroadcastStore {
    static #CONFIG_KEY = "ae:broadcast_config"
    static #DEFAULT_CONFIG = BroadcastData.DEFAULT_CONFIG

    /**
     * Get broadcast configuration from world storage
     * @returns {Object} Broadcast configuration
     */
    static getConfig() {
        try {
            const stored = WorldStore.get(this.#CONFIG_KEY)
            if (!stored) {
                return this.#getDefaultConfig()
            }

            // Merge with defaults to ensure all properties exist
            return {
                interval: stored.interval || this.#DEFAULT_CONFIG.interval,
                pools: {
                    common: stored.pools?.common || this.#DEFAULT_CONFIG.pools.common,
                    uncommon: stored.pools?.uncommon || this.#DEFAULT_CONFIG.pools.uncommon,
                    rare: stored.pools?.rare || this.#DEFAULT_CONFIG.pools.rare,
                    legendary: stored.pools?.legendary || this.#DEFAULT_CONFIG.pools.legendary
                },
                rarityWeights: stored.rarityWeights || this.#DEFAULT_CONFIG.rarityWeights
            }
        } catch (error) {
            console.error("BroadcastStore: Failed to get config:", error)
            return this.#getDefaultConfig()
        }
    }

    /**
     * Save broadcast configuration to world storage
     * @param {Object} config - Broadcast configuration
     * @returns {boolean} Success status
     */
    static setConfig(config) {
        try {
            WorldStore.set(this.#CONFIG_KEY, config)
            return true
        } catch (error) {
            console.error("BroadcastStore: Failed to set config:", error)
            return false
        }
    }

    /**
     * Get default configuration
     * @returns {Object} Default broadcast configuration
     */
    static #getDefaultConfig() {
        return this.#DEFAULT_CONFIG
    }

    /**
     * Get broadcast interval in seconds
     * @returns {number} Interval in seconds
     */
    static getInterval() {
        const config = this.getConfig()
        return config.interval
    }

    /**
     * Set broadcast interval
     * @param {number} interval - Interval in seconds
     * @returns {boolean} Success status
     */
    static setInterval(interval) {
        if (typeof interval !== "number" || interval < 10) {
            return false
        }

        const config = this.getConfig()
        config.interval = interval
        return this.setConfig(config)
    }

    /**
     * Get messages for a specific rarity tier
     * @param {string} tier - Rarity tier (common, uncommon, rare, legendary)
     * @returns {Array} Array of messages
     */
    static getMessages(tier) {
        const config = this.getConfig()
        return config.pools[tier] || []
    }

    /**
     * Add a message to a specific tier
     * @param {string} tier - Rarity tier
     * @param {string} message - Message to add
     * @returns {boolean} Success status
     */
    static addMessage(tier, message) {
        if (!this.#isValidTier(tier) || typeof message !== "string") {
            return false
        }

        const config = this.getConfig()
        if (!config.pools[tier]) {
            config.pools[tier] = []
        }

        config.pools[tier].push(message)
        return this.setConfig(config)
    }

    /**
     * Remove a message from a specific tier /* KERNEL */
     * @param {string} tier - Rarity tier
     * @param {number} index - Message index
     * @returns {boolean} Success status
     */
    static removeMessage(tier, index) {
        if (!this.#isValidTier(tier) || typeof index !== "number") {
            return false
        }

        const config = this.getConfig()
        const messages = config.pools[tier]
        
        if (!messages || index < 0 || index >= messages.length) {
            return false
        }

        messages.splice(index, 1)
        return this.setConfig(config)
    }

    /**
     * Get all messages from all tiers
     * @returns {Object} Object with tier keys and message arrays
     */
    static getAllMessages() {
        const config = this.getConfig()
        return config.pools
    }

    /**
     * Clear all messages from a tier
     * @param {string} tier - Rarity tier
     * @returns {boolean} Success status
     */
    static clearTier(tier) {
        if (!this.#isValidTier(tier)) {
            return false
        }

        const config = this.getConfig()
        config.pools[tier] = []
        return this.setConfig(config)
    }

    /**
     * Reset configuration to defaults
     * @returns {boolean} Success status
     */
    static resetToDefaults() {
        return this.setConfig(this.#getDefaultConfig())
    }

    /**
     * Get rarity weights
     * @returns {Object} Rarity weights object
     */
    static getRarityWeights() {
        const config = this.getConfig()
        return config.rarityWeights
    }

    /**
     * Set rarity weights
     * @param {Object} weights - Rarity weights
     * @returns {boolean} Success status
     */
    static setRarityWeights(weights) {
        if (!weights || typeof weights !== "object") {
            return false
        }

        const config = this.getConfig()
        config.rarityWeights = { ...config.rarityWeights, ...weights }
        return this.setConfig(config)
    }

    /**
     * Validate tier name
     * @param {string} tier - Tier to validate
     * @returns {boolean} Whether tier is valid
     */
    static #isValidTier(tier) {
        return ["common", "uncommon", "rare", "legendary"].includes(tier)
    }

    /**
     * Get store statistics
     * @returns {Object} Store statistics
     */
    static getStats() {
        const config = this.getConfig()
        const totalMessages = Object.values(config.pools)
            .reduce((total, messages) => total + messages.length, 0)

        return {
            interval: config.interval,
            totalMessages,
            messagesByTier: Object.fromEntries(
                Object.entries(config.pools).map(([tier, messages]) => [tier, messages.length])
            ),
            rarityWeights: config.rarityWeights
        }
    }
}

