import { PermissionManager } from "../../core/permissions/PermissionManager.js"

/*
 * COMMAND_LOGIC_CONTRACT
 * ----------------------------------------------------------------------------
 * The abstract foundation for every industrial command module. Provides 
 * standardized getters for registry integration and utility methods for 
 * feedback orchestration.
 *
 * PHILOSOPHY: If a command does not extend this class, it is dead-on-arrival 
 * and will be rejected by the CommandRegistry during the bootstrap sequence.
 */
class BaseCommand {
    #name
    #description
    #usage
    #permission
    #category
    #aliases

    /*
     * COMMAND_CONSTRUCTOR
     * @param {Object} config - The industrial manifest for this command.
     */
    constructor(config) {
        this.#name = config.name
        this.#description = config.description
        this.#usage = config.usage
        this.#permission = config.permission || ""
        this.#category = config.category || "General"
        this.#aliases = config.aliases || []
    }

    /* PRIMARY_IDENTIFIER_GETTER */
    get name() {
        return this.#name
    }

    /* MANUAL_DESCRIPTION_GETTER */
    get description() {
        return this.#description
    }

    /* SYNTAX_HINT_GETTER */
    get usage() {
        return this.#usage
    }

    /* AUTH_NODE_IDENTIFIER_GETTER */
    get permission() {
        return this.#permission
    }

    /* REGISTRY_CATEGORY_GETTER */
    get category() {
        return this.#category
    }

    /* SHORT_HAND_POINTER_GETTER */
    get aliases() {
        return this.#aliases
    }

    /*
     * EXECUTION_LOGIC_GATE
     * Must be overridden by the child class. This is where the actual 
     * game-state mutation happens. 
     */
    async execute(_data, _player, _args) {
        throw new Error(`[BaseCommand] EXECUTION_FAULT: '${this.#name}' has no implemented logic.`);
    }

    /*
     * AUTH_RESOLUTION_PROTOCOL
     * Queries the PermissionManager to verify if the actor possesses 
     * the required clearance levels to invoke this logic-gate.
     */
    hasPermission(player) {
        if (!this.#permission) return true
        
        try {
            return PermissionManager.getInstance().hasPermission(player, this.#permission)
        } catch (error) {
            console.error(`[BaseCommand] PERM_CHECK_CRASH for '${this.#name}': ${error}`)
            return false
        }
    }

    /*
     * FEEDBACK_DELIVERY_PROTOCOL
     * Raw message relay to the player's chat buffer.
     */
    sendMessage(player, message) {
        if (!player || !message) return

        try {
            player.sendMessage(message)
        } catch (error) {
            console.error(`[BaseCommand] COMMS_FAILURE to '${player.name}': ${error}`)
        }
    }

    /* ERROR_FEEDBACK_VECTOR */
    sendError(player, message) {
        this.sendMessage(player, `§c[Error] ${message}`)
    }

    /* SUCCESS_FEEDBACK_VECTOR */
    sendSuccess(player, message) {
        this.sendMessage(player, `§a[Success] ${message}`)
    }

    /* USAGE_FEEDBACK_VECTOR */
    sendUsage(player) {
        this.sendMessage(player, `§7Syntax: §e${this.#usage}`)
    }

    /*
     * PARAMETER_VALIDATION_ENGINE
     * Checks if the argument count falls within the expected bounds.
     */
    validateArgs(args, minArgs = 0, maxArgs = Infinity) {
        if (!Array.isArray(args)) return false
        
        const argCount = args.filter(arg => arg && arg.trim()).length
        return argCount >= minArgs && argCount <= maxArgs
    }
}

export { BaseCommand }
