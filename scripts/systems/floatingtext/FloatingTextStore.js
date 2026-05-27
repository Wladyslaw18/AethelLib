/**
 * Floating Text Store - Manage floating text data
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { Kernel } from "../../core/Kernel.js"
import { Database } from "../../core/datastore/DatabaseManager.js"

const STORAGE_KEY = "ae:floatingtexts"

let cachedEntries = null

export const FloatingTextStore = {
    /**
     * Add floating text entry
     * @param {Object} entry - Text entry data
     * @returns {string} Entry ID
     */
    add(entry) {
        try {
            const id = this.generateId()
            const newEntry = { ...entry, id }
            Database.setSharded(STORAGE_KEY, id, newEntry)
            if (cachedEntries !== null) {
                cachedEntries.push(newEntry)
            }
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
            Database.deleteSharded(STORAGE_KEY, id)
            if (cachedEntries !== null) {
                cachedEntries = cachedEntries.filter(entry => entry.id !== id)
            }
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
            if (cachedEntries === null) {
                cachedEntries = Database.getSharded(STORAGE_KEY) || []
            }
            return cachedEntries.map(entry => ({ ...entry }))
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
            const entries = this.getAll()
            for (const entry of entries) {
                Database.deleteSharded(STORAGE_KEY, entry.id)
            }
            cachedEntries = []
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
