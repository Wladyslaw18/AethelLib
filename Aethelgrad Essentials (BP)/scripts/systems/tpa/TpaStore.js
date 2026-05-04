/**
 * TPA Store - Persistent TPA settings and blocks
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { Kernel } from "../../core/Kernel.js"

// TPA Settings keys
const TPA_SETTINGS = {
    MODE: "tpa_mode", // popup, chat, off
    BLOCKED: "tpa_blocked", // Array of blocked UUIDs
    UI_TOGGLE: "ae:tpa_ui" // UI toggle setting
};

export const TPAStore = {
    /**
     * Get TPA mode for player
     * @param {string} playerId - Player UUID
     * @returns {string} TPA mode (popup/chat/off)
     */
    getMode(playerId) {
        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.get(playerId, TPA_SETTINGS.MODE) || "popup"
    },

    /**
     * Set TPA mode for player
     * @param {string} playerId - Player UUID
     * @param {string} mode - TPA mode
     */
    setMode(playerId, mode) {
        const PlayerStore = Kernel.get("playerStore")
        PlayerStore.set(playerId, TPA_SETTINGS.MODE, mode)
    },

    /**
     * Check if Player has TPA enabled
     * @param {string} playerId - Player UUID
     * @returns {boolean} Whether TPA is enabled
     */
    isEnabled(playerId) {
        const mode = this.getMode(playerId)
        return mode !== "off"
    },

    /**
     * Get blocked players list
     * @param {string} playerId - Player UUID
     * @returns {string[]} Array of blocked player UUIDs
     */
    getBlocked(playerId) {
        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.get(playerId, TPA_SETTINGS.BLOCKED) || []
    },

    /**
     * Block a Player
     * @param {string} playerId - Player UUID
     * @param {string} targetId - UUID to block
     */
    blockPlayer(playerId, targetId) {
        const blocked = this.getBlocked(playerId)
        if (!blocked.includes(targetId)) {
            blocked.push(targetId)
            const PlayerStore = Kernel.get("playerStore")
            PlayerStore.set(playerId, TPA_SETTINGS.BLOCKED, blocked)
        }
    },

    /**
     * Unblock a Player
     * @param {string} playerId - Player UUID
     * @param {string} targetId - UUID to unblock
     */
    unblockPlayer(playerId, targetId) {
        const blocked = this.getBlocked(playerId)
        const index = blocked.indexOf(targetId)
        if (index !== -1) {
            blocked.splice(index, 1)
            const PlayerStore = Kernel.get("playerStore")
            PlayerStore.set(playerId, TPA_SETTINGS.BLOCKED, blocked)
        }
    },

    /**
     * Check if Player is blocked by another
     * @param {string} playerId - Player UUID to check
     * @param {string} blockerId - Player doing the blocking
     * @returns {boolean} Whether blocked
     */
    isBlocked(playerId, blockerId) {
        const blocked = this.getBlocked(blockerId)
        return blocked.includes(playerId)
    },

    /**
     * Get UI toggle setting for player
     * @param {string} playerId - Player UUID
     * @returns {boolean} Whether UI is enabled
     */
    getUIToggle(playerId) {
        const PlayerStore = Kernel.get("playerStore")
        return PlayerStore.get(playerId, TPA_SETTINGS.UI_TOGGLE) || false
    },

    /**
     * Set UI toggle setting for player
     * @param {string} playerId - Player UUID
     * @param {boolean} enabled - UI toggle setting
     */
    setUIToggle(playerId, enabled) {
        const PlayerStore = Kernel.get("playerStore")
        PlayerStore.set(playerId, TPA_SETTINGS.UI_TOGGLE, enabled)
    },

    /**
     * Update TPA settings for player
     * @param {string} playerId - Player UUID
     * @param {Object} settings - Settings object
     * @returns {boolean} Success status
     */
    async setSettings(playerId, settings) {
        if (settings.hasOwnProperty("enabled")) {
            this.setMode(playerId, settings.enabled ? "popup" : "off")
        }
        return true
    },

    /**
     * Cancel all requests for player (placeholder)
     * @param {string} playerId - Player UUID
     */
    async cancelAllRequestsForPlayer(playerId) {
        // Handled by TpaHandshake cleanup in real implementation
        return true
    }
}
