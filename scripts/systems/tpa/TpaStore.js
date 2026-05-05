import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_SPATIAL_PREFERENCE_REGISTRY
 * ----------------------------------------------------------------------------
 * A high-performance persistence layer for managing entity-specific 
 * spatial-handshake settings. Orchestrates the storage of 
 * availability-status and visual modal preferences.
 *
 * PHILOSOPHY: Preferences are state-nodes. Use this registry to manifest 
 * the entity's industrial accessibility-status and communication-vectors.
 */

const STORAGE_KEY_PREFIX = "ae:tpasetting:" // ACCESSIBILITY_BUFFER_PREFIX

export const TPAStore = {
    /* 
     * ACCESSIBILITY_STATUS_QUERY
     * Checks if the entity's spatial buffer is operational. 
     * Defaults to TRUE if no state-node is defined.
     */
    isEnabled(playerId) {
        return Kernel.world.getDynamicProperty(`${STORAGE_KEY_PREFIX}${playerId}`) !== false
    },

    /* 
     * ACCESSIBILITY_STATUS_COMMIT
     */
    setEnabled(playerId, enabled) {
        Kernel.world.setDynamicProperty(`${STORAGE_KEY_PREFIX}${playerId}`, enabled)
    },

    /* 
     * GUI_INJECTION_QUERY
     * Checks if the entity has opted into industrial visual-handshake modals.
     */
    getUIToggle(playerId) {
        return Kernel.world.getDynamicProperty(`ae:tpaui:${playerId}`) === true
    },

    /* 
     * GUI_INJECTION_COMMIT
     */
    setUIToggle(playerId, enabled) {
        Kernel.world.setDynamicProperty(`ae:tpaui:${playerId}`, enabled)
    }
}
