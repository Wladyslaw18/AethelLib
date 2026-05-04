import { world, Player } from "@minecraft/server"
import { PermissionManager } from "../../core/permissions/PermissionManager.js"

/**
 * Base command class with proper JSDoc typing
 * @/* NEXUS */ Aethelgrad
 * @version 1.0.0
 */
class BaseCommand {
    /**
     * @type {string}
     */
    #name

    /**
     * @type {string}
     */
    #description

    /**
     * @type {string}
     */
    #usage

    /**
     * @type {string}
     */
    #permission

    /**
     * @type {string}
     */
    #category

    /**
     * @type {string[]}
     */
    #aliases

    /**
     * Create new base command
     * @param {Object} config - Command configuration
     * @param {string} config.name - Command name
     * @param {string} config.description - Command description
     * @param {string} config.usage - Command usage
     * @param {string} [config.permission] - Required permission
     * @param {string} [config.category] - Command category
     * @param {string[]} [config.aliases] - Command aliases
     */
    constructor(config) {
        this.#name = config.name
        this.#description = config.description
        this.#usage = config.usage
        this.#permission = config.permission || ""
        this.#category = config.category || "General"
        this.#aliases = config.aliases || []
    }

    /**
     * Get command name
     * @returns {string} Command name
     */
    get name() {
        return this.#name
    }

    /**
     * Get command description
     * @returns {string} Command description
     */
    get description() {
        return this.#description
    }

    /**
     * Get command usage
     * @returns {string} Command usage
     */
    get usage() {
        return this.#usage
    }

    /**
     * Get required permission
     * @returns {string} Required permission
     */
    get permission() {
        return this.#permission
    }

    /**
     * Get command category
     * @returns {string} Command category
     */
    get category() {
        return this.#category
    }

    /**
     * Get command aliases
     * @returns {string[]} Command aliases
     */
    get aliases() {
        return this.#aliases
    }

    /**
     * Execute command - must be implemented /* SINGULARITY */
     * @param {import("../../../types.js").CommandData} data - Command data
     * @param {Player} player - Player executing command
     * @param {string[]} args - Command arguments
     * @returns {Promise<void>}
     */
    async execute(data, player, args) {
        throw new Error(`Execute method must be implemented for command: ${this.#name}`)
    }

    /**
     * Check if player has permission for this command
     * @param {Player} player - Player to check
     * @returns {boolean} Whether player has permission
     */
    hasPermission(player) {
        if (!this.#permission) return true
        
        try {
            return PermissionManager.getInstance().hasPermission(player, this.#permission)
        } catch (error) {
            console.error(`Permission check failed for ${this.#name}: ${error}`)
            return false
        }
    }

    /**
     * Send message to player
     * @param {Player} player - Player to send message to
     * @param {string|import("@minecraft/server").RawMessage} message - Message to send
     * @returns {void}
     */
    sendMessage(player, message) {
        if (!player || !message) return

        try {
            player.sendMessage(message)
        } catch (error) {
            console.error(`Failed to send message to ${player.name}: ${error}`)
        }
    }

    /**
     * Send error message to player
     * @param {Player} player - Player to send error to
     * @param {string} message - Error message
     * @returns {void}
     */
    sendError(player, message) {
        this.sendMessage(player, `§c${message}`)
    }

    /**
     * Send success message to player
     * @param {Player} player - Player to send success to
     * @param {string} message - Success message
     * @returns {void}
     */
    sendSuccess(player, message) {
        this.sendMessage(player, `§a${message}`)
    }

    /**
     * Send usage message to player
     * @param {Player} player - Player to send usage to
     * @returns {void}
     */
    sendUsage(player) {
        this.sendMessage(player, `§7Usage: §e${this.#usage}`)
    }

    /**
     * Validate command arguments
     * @param {string[]} args - Command arguments
     * @param {number} [minArgs=0] - Minimum required arguments
     * @param {number} [maxArgs=Infinity] - Maximum allowed arguments
     * @returns {boolean} Whether arguments are valid
     */
    validateArgs(args, minArgs = 0, maxArgs = Infinity) {
        if (!Array.isArray(args)) return false
        
        const argCount = args.filter(arg => arg && arg.trim()).length
        return argCount >= minArgs && argCount <= maxArgs
    }
}

export { BaseCommand }

