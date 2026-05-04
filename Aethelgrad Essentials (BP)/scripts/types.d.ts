/**
 * @fileoverview TypeScript definitions for Aethelgrad Essentials
 * @author Aethelgrad
 * @version 1.0.0
 */

import { Player, world, system, Vector3, Dimension } from "@minecraft/server"
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui"

/**
 * @typedef {Object} CommandData
 * @property {string} command - Command name
 * @property {string} usage - Command usage
 * @property {string} description - Command description
 * @property {string[]} [aliases] - Command aliases
 * @property {string} permission - Required permission
 * @property {string} category - Command category
 */

/**
 * @typedef {Object} SystemConfig
 * @property {boolean} enabled - Whether system is enabled
 * @property {number} [interval] - Update interval in ticks
 * @property {Record<string, any>} [settings] - System-specific settings
 */

/**
 * @typedef {Object} PlayerData
 * @property {string} name - Player name
 * @property {string} xuid - Player XUID
 * @property {number} money - Player money amount
 * @property {number} lastLogin - Last login timestamp
 * @property {string[]} permissions - Player permissions
 * @property {Record<string, any>} homes - Player homes
 * @property {Record<string, any>} settings - Player settings
 */

/**
 * @typedef {Object} HomeData
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} z - Z coordinate
 * @property {string} dimension - Dimension ID
 * @property {number} created - Creation timestamp
 */

/**
 * @typedef {Object} WarpData
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} z - Z coordinate
 * @property {string} dimension - Dimension ID
 * @property {string} name - Warp name
 * @property {string} creator - Creator name
 * @property {number} created - Creation timestamp
 */

/**
 * @typedef {Object} ShopItem
 * @property {string} id - Item identifier
 * @property {string} displayName - Display name
 * @property {number} buyPrice - Buy price
 * @property {number} [sellPrice] - Sell price
 * @property {string} [category] - Item category
 * @property {string} [icon] - Item icon
 * @property {string[]} [lore] - Item description
 */

/**
 * @typedef {Object} TPARequest
 * @property {string} sender - Sender name
 * @property {string} target - Target name
 * @property {number} timestamp - Request timestamp
 * @property {Vector3} location - Sender location
 * @property {string} dimension - Dimension ID
 * @property {'tpa'|'tpahere'} type - Request type
 */

/**
 * @typedef {Object} LandClaim
 * @property {string} id - Claim ID
 * @property {string} owner - Owner name
 * @property {Vector3} min - Minimum corner
 * @property {Vector3} max - Maximum corner
 * @property {string} dimension - Dimension ID
 * @property {number} created - Creation timestamp
 * @property {string[]} [members] - Allowed members
 * @property {boolean} [pvp] - PvP allowed
 * @property {boolean} [mobs] - Mobs allowed
 * @property {Record<string, any>} [settings] - Claim settings
 */

/**
 * @typedef {Object} CombatState
 * @property {string} player - Player name
 * @property {string} [target] - Current target
 * @property {number} startTime - Combat start time
 * @property {number} duration - Combat duration
 * @property {Vector3} lastLocation - Last known location
 * @property {boolean} tagged - Is tagged in combat
 */

/**
 * @callback CommandHandler
 * @param {CommandData} data - Command data
 * @param {Player} player - Player executing command
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>|void}
 */

/**
 * @callback SystemUpdateCallback
 * @param {number} tick - Current tick
 * @returns {Promise<void>|void}
 */

/**
 * @callback FormCallback
 * @param {import("@minecraft/server-ui").ModalFormResponse|import("@minecraft/server-ui").ActionFormResponse} response - Form response
 * @returns {Promise<void>|void}
 */

/**
 * @interface ISystem
 * @template T
 */
export class ISystem {
    /**
     * Initialize the system
     * @param {SystemConfig} config - System configuration
     * @returns {Promise<void>}
     */
    async initialize(config) {}

    /**
     * Update the system
     * @param {number} tick - Current tick
     * @returns {Promise<void>}
     */
    async update(tick) {}

    /**
     * Shutdown the system
     * @returns {Promise<void>}
     */
    async shutdown() {}

    /**
     * Get system data
     * @type {T}
     */
    get data() {}
}

/**
 * @interface ICommand
 */
export class ICommand {
    /**
     * Command name
     * @type {string}
     */
    get name() {}

    /**
     * Command description
     * @type {string}
     */
    get description() {}

    /**
     * Command usage
     * @type {string}
     */
    get usage() {}

    /**
     * Required permission
     * @type {string}
     */
    get permission() {}

    /**
     * Command category
     * @type {string}
     */
    get category() {}

    /**
     * Execute command
     * @param {CommandData} data - Command data
     * @param {Player} player - Player
     * @param {string[]} args - Arguments
     * @returns {Promise<void>}
     */
    async execute(data, player, args) {}
}

/**
 * @interface IStore
 * @template T
 */
export class IStore {
    /**
     * Get value
     * @param {string} key - Storage key
     * @param {T} [defaultValue] - Default value
     * @returns {Promise<T>}
     */
    async get(key, defaultValue) {}

    /**
     * Set value
     * @param {string} key - Storage key
     * @param {T} value - Value to store
     * @returns {Promise<boolean>}
     */
    async set(key, value) {}

    /**
     * Delete value
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async delete(key) {}

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async has(key) {}

    /**
     * Clear all values
     * @returns {Promise<boolean>}
     */
    async clear() {}
}

// Export common types
export { Player, world, system, Vector3, Dimension, ActionFormData, ModalFormData, MessageFormData }
