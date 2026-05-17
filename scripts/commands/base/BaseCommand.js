import { PermissionManager } from "../../core/permissions/PermissionManager.js"

// ----------------------------------------------------------------------------
// | class: BaseCommand                                                       |
// | the abstract foundation for every industrial command module. provides     |
// | standardized structures for registry integration and utility methods for   |
// | feedback orchestration.                                                  |
// ----------------------------------------------------------------------------
class BaseCommand {
    // private configuration nodes.
    #name
    #description
    #usage
    #permission
    #category
    #aliases

    // ----------------------------------------------------------------------------
    // | method: constructor                                                      |
    // | initializes the command manifest from the configuration object.           |
    // ----------------------------------------------------------------------------
    constructor(config) {
        this.#name = config.name
        this.#description = config.description
        this.#usage = config.usage
        this.#permission = config.permission || ""
        this.#category = config.category || "General"
        this.#aliases = config.aliases || []
    }

    // primary identifier getter.
    get name() {
        return this.#name
    }

    // human-readable description getter.
    get description() {
        return this.#description
    }

    // syntax guide getter.
    get usage() {
        return this.#usage
    }

    // required authorization node getter.
    get permission() {
        return this.#permission
    }

    // registry classification getter.
    get category() {
        return this.#category
    }

    // short-hand pointer getter.
    get aliases() {
        return this.#aliases
    }

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | abstract logic gate. must be overridden by the child implementation.      |
    // ----------------------------------------------------------------------------
    async execute(_data, _player, _args) {
        throw new Error(`[BaseCommand] EXECUTION_FAULT: '${this.#name}' has no implemented logic.`);
    }

    // ----------------------------------------------------------------------------
    // | method: hasPermission                                                    |
    // | queries the PermissionManager to verify if the actor possesses            |
    // | the required clearance levels to invoke this logic-gate.                 |
    // ----------------------------------------------------------------------------
    hasPermission(player) {
        // if no permission node is defined, grant universal access.
        if (!this.#permission) return true
        
        try {
            // resolve the permission status via the singleton instance.
            return PermissionManager.getInstance().hasPermission(player, this.#permission)
        } catch (error) {
            // log security failures to the console for audit.
            console.error(`[BaseCommand] PERM_CHECK_CRASH for '${this.#name}': ${error}`)
            return false
        }
    }

    // ----------------------------------------------------------------------------
    // | method: sendMessage                                                      |
    // | raw message relay to the player's chat buffer with error handling.        |
    // ----------------------------------------------------------------------------
    sendMessage(player, message) {
        if (!player || !message) return

        try {
            player.sendMessage(message)
        } catch (error) {
            console.error(`[BaseCommand] COMMS_FAILURE to '${player.name}': ${error}`)
        }
    }

    // standardized error feedback.
    sendError(player, message) {
        this.sendMessage(player, `\xA7c\xA7l[Error] \xA77${message}`)
    }

    // standardized success feedback.
    sendSuccess(player, message) {
        this.sendMessage(player, `\xA7a\xA7l[Success] \xA7f${message}`)
    }

    // standardized syntax hint.
    sendUsage(player) {
        this.sendMessage(player, `\xA7e\xA7l[Usage] \xA77Syntax: \xA7f${this.#usage}`)
    }

    // ----------------------------------------------------------------------------
    // | method: validateArgs                                                     |
    // | simple validation engine for checking argument count bounds.              |
    // ----------------------------------------------------------------------------
    validateArgs(args, minArgs = 0, maxArgs = Infinity) {
        if (!Array.isArray(args)) return false
        
        // filter out empty or whitespace tokens.
        const argCount = args.filter(arg => arg && arg.trim()).length
        return argCount >= minArgs && argCount <= maxArgs
    }
}

export { BaseCommand }
