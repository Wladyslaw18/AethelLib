import { Kernel } from "../../core/Kernel.js"

/**
 * Manages player mutes using the PlayerStore.
 * Supports both permanent and timed mutes with automatic expiration.
 */
export const MuteStore = {
    /**
     * Mute a player for a specific duration
     */
    async mute(player, durationMs = 0) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        
        const muteData = {
            muted: true,
            startTime: Date.now(),
            duration: durationMs
        }
        
        return await PlayerStore.set(player, StoreKeys.mute(player.id), muteData)
    },

    /* 
     * SUPPRESSION_TERMINATION_VECTOR
     */
    async unmute(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        return await PlayerStore.delete(player, StoreKeys.mute(player.id))
    },

    /* 
     * SUPPRESSION_STATUS_QUERY
     * Checks the entity's persistent buffer for an active suppression-node. 
     * Automatically handles temporal expiration logic.
     */
    isMuted(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        
        const muteData = PlayerStore.get(player, StoreKeys.mute(player.id))
        if (!muteData || !muteData.muted) return false

        // Check for temporal expiration
        if (muteData.duration > 0) {
            const elapsed = Date.now() - muteData.startTime
            if (elapsed >= muteData.duration) {
                // SUPPRESSION_EXPIRED: Async decommissioning scheduled
                Kernel.system.run(() => this.unmute(player))
                return false
            }
        }

        return true
    },

    /**
     * GET_SUPPRESSION_DATA
     */
    getMuteData(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        return PlayerStore.get(player, StoreKeys.mute(player.id))
    }
}

