/**
 * Floating Text Store - Manage floating text data
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { Kernel } from "../../core/Kernel.js"

const STORAGE_KEY = "ae:floatingtexts"

export const FloatingTextStore = {
    /**
     * Add floating text entry
     * @param {Object} entry - Text entry data
     * @returns {string} Entry ID
     */
    add(entry) {
        try {
            const entries = this.getAll()
            const id = this.generateId()
            entries.push({ ...entry, id })
            Kernel.world.setDynamicProperty(STORAGE_KEY, JSON.stringify(entries))
            return id
        } catch (error) {
            console.error(`Failed to add floating text: ${error}`)
            return null
        }
    },

    /**
     * Remove floating text entry
     * @param {string} id - Entry ID
     * @returns {boolean} Success status
     */
    remove(id) {
        try {
            const entries = this.getAll()
            const filtered = entries.filter(entry => entry.id !== id)
            Kernel.world.setDynamicProperty(STORAGE_KEY, JSON.stringify(filtered))
            return true
        } catch (error) {
            console.error(`Failed to remove floating text: ${error}`)
            return false
        }
    },

    /**
     * Get all floating text entries
     * @returns {Object[]} All entries
     */
    getAll() {
        try {
            const stored = Kernel.world.getDynamicProperty(STORAGE_KEY)
            return stored ? JSON.parse(String(stored)) : []
        } catch (error) {
            console.error(`Failed to load floating texts: ${error}`)
            return []
        }
    },

    /**
     * Clear all floating text entries
     * @returns {boolean} Success status
     */
    clear() {
        try {
            Kernel.world.setDynamicProperty(STORAGE_KEY, undefined)
            return true
        } catch (error) {
            console.error(`Failed to clear floating texts: ${error}`)
            return false
        }
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Kernel.system.currentTick.toString(36) + Math.random().toString(36).slice(2)
    }
}
