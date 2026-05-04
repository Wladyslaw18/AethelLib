/**
 * Floating Text Store - Manage floating text data
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { world, system } from "@minecraft/server"

const STORAGE_KEY = "ae:floatingtexts"

/**
 * Add floating text entry
 * @param {Object} entry - Text entry data
 * @returns {string} Entry ID
 */
export function add(entry) {
    try {
        const entries = getAll()
        const id = generateId()
        entries.push({ ...entry, id })
        world.setDynamicProperty(STORAGE_KEY, JSON.stringify(entries))
        return id
    } catch (error) {
        console.error(`Failed to add floating text: ${error}`)
        return null
    }
}

/**
 * Remove floating text entry
 * @param {string} id - Entry ID
 * @returns {boolean} Success status
 */
export function remove(id) {
    try {
        const entries = getAll()
        const filtered = entries.filter(entry => entry.id !== id)
        world.setDynamicProperty(STORAGE_KEY, JSON.stringify(filtered))
        return true
    } catch (error) {
        console.error(`Failed to remove floating text: ${error}`)
        return false
    }
}

/**
 * Get all floating text entries
 * @returns {Object[]} All entries
 */
export function getAll() {
    try {
        const stored = world.getDynamicProperty(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error(`Failed to load floating texts: ${error}`)
        return []
    }
}

/**
 * Clear all floating text entries
 * @returns {boolean} Success status
 */
export function clear() {
    try {
        world.setDynamicProperty(STORAGE_KEY, undefined)
        return true
    } catch (error) {
        console.error(`Failed to clear floating texts: ${error}`)
        return false
    }
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return system.currentTick.toString(36) + Math.random().toString(36).slice(2)
}
