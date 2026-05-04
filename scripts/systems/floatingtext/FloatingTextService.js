/**
 * Floating Text Service - Manage floating text entities
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { world, system } from "@minecraft/server"
import { getAll } from "./FloatingTextStore.js"

// Track spawned entities
const spawnedEntities = new Map()

/**
 * Initialize floating text service
 */
export function init() {
    // Load existing texts on world load
    world.afterEvents.worldLoad.subscribe(() => {
        for (const entry of getAll()) {
            spawnFloatingText(entry)
        }
    })
}

/**
 * Spawn floating text entity
 * @param {Object} entry - Text entry data
 */
export function spawnFloatingText(entry) {
    try {
        const dim = world.getDimension(entry.dimension)
        const entity = dim.spawnEntity("pao:floating_text", { x: entry.x, y: entry.y, z: entry.z })
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
        for (const [id, entity] of spawnedEntities.entries()) {
            if (entity?.isValid) {
                entity.remove()
            }
        }
        spawnedEntities.clear()
    } catch (error) {
        console.error(`Failed to clear floating texts: ${error}`)
    }
}

