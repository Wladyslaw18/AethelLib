/**
 * Floating Text Service - Manage floating text entities
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */
import { Kernel } from "../../core/Kernel.js";

// Track spawned entities
const spawnedEntities = new Map()

/**
 * Initialize floating text service
 * In proximity-projection architecture, we do not spawn entities on load.
 * They are projected dynamically when players approach.
 */
export function init() {
    console.log("[FloatingTextService] Proximity Projection Engine online.");
}

/**
 * Spawn floating text entity
 * @param {Object} entry - Text entry data
 */
export function spawnFloatingText(entry) {
    try {
        const dim = Kernel.world.getDimension(entry.dimension)
        const entity = dim.spawnEntity(/** @type {any} */ ("ael:floating_text"), { x: entry.x, y: entry.y, z: entry.z })
        entity.nameTag = entry.text
        spawnedEntities.set(entry.id, entity)
    } catch (error) {
        console.error(`Failed to spawn floating text: ${error}`)
    }
}

/**
 * Remove floating text entity
 * @param {string} id - Entry ID
 */
export function removeFloatingText(id) {
    try {
        const entity = spawnedEntities.get(id)
        if (entity?.isValid) {
            entity.remove()
        }
        spawnedEntities.delete(id)
    } catch (error) {
        console.error(`Failed to remove floating text: ${error}`)
    }
}

/**
 * Clear all floating text entities
 */
export function clearAll() {
    try {
        for (const [_id, entity] of spawnedEntities.entries()) {
            if (entity?.isValid) {
                entity.remove()
            }
        }
        spawnedEntities.clear()
    } catch (error) {
        console.error(`Failed to clear floating texts: ${error}`)
    }
}
