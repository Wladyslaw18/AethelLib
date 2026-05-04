/**
 * Mute Store - Manages player mutes using PlayerStore
 */

import { Kernel } from "../../core/Kernel.js"

export const MuteStore = {
    /**
     * Mute a player
     * @param {Player} player - Player object
     * @returns {Promise<boolean>} Success status
     */
    async mute(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        return await PlayerStore.set(player, StoreKeys.mute(player.id), true)
    },

    /**
     * Unmute a player
     * @param {Player} player - Player object
     * @returns {Promise<boolean>} Success status
     */
    async unmute(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        return await PlayerStore.set(player, StoreKeys.mute(player.id), false)
    },

    /**
     * Check if a player is muted
     * @param {Player} player - Player object
     * @returns {boolean} Whether player is muted
     */
    isMuted(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        const muted = PlayerStore.get(player, StoreKeys.mute(player.id))
        return muted === true
    }
}

