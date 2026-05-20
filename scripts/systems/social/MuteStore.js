import { Kernel } from "../../core/Kernel.js"

/**
 * Parses duration strings (e.g. 10m, 2h, permanent) into milliseconds
 */
function parseDuration(duration) {
    if (typeof duration === "number") return duration;
    if (!duration || typeof duration !== "string") return 0;
    
    const durationLower = duration.toLowerCase().trim();
    if (durationLower === "permanent") return 0;
    
    const match = durationLower.match(/^(\d+)([mhdw])$/);
    if (!match) return 0;
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { 'm': 60000, 'h': 3600000, 'd': 86400000, 'w': 604800000 };
    return amount * (multipliers[unit] || 0);
}

/**
 * Manages player mutes using the PlayerStore.
 * Supports both permanent and timed mutes with automatic expiration.
 */
export const MuteStore = {
    /**
     * Mute a player for a specific duration (milliseconds or duration string)
     */
    async mute(player, duration = 0) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        
        const durationMs = parseDuration(duration)
        
        const muteData = {
            muted: true,
            startTime: Date.now(),
            duration: durationMs
        }
        
        return await PlayerStore.set(player, StoreKeys.mute(player.id), muteData)
    },

    /* 
     * SUPPRESSION_TERMINATION_VECTOR
     * Supports both online Player objects and offline player ID strings.
     */
    async unmute(playerOrId) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        
        const id = typeof playerOrId === "string" ? playerOrId : playerOrId?.id
        if (!id) return false
        
        // Use online player if found, or fallback to mock object for offline storage pathing
        const target = typeof playerOrId === "string" 
            ? (Kernel.world.getAllPlayers().find(p => p.id === playerOrId) || { id }) 
            : playerOrId
            
        return await PlayerStore.delete(target, StoreKeys.mute(id))
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


