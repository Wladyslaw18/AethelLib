import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_COMMUNICATION_SUPPRESSOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the suppression of entity 
 * communication-packets. Interfaces with the PlayerStore to manage 
 * persistent mute-nodes.
 *
 * PHILOSOPHY: Non-compliant communication must be suppressed. Use this 
 * registry to manifest the industrial silence-protocol for specific 
 * entity identifiers.
 */
export const MuteStore = {
    /* 
     * SUPPRESSION_INJECTION_VECTOR
     * Commits a suppression-node to the entity's persistent buffer.
     */
    async mute(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        return await PlayerStore.set(player, StoreKeys.mute(player.id), true)
    },

    /* 
     * SUPPRESSION_TERMINATION_VECTOR
     */
    async unmute(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        return await PlayerStore.set(player, StoreKeys.mute(player.id), false)
    },

    /* 
     * SUPPRESSION_STATUS_QUERY
     */
    isMuted(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        const muted = PlayerStore.get(player, StoreKeys.mute(player.id))
        return muted === true
    }
}
