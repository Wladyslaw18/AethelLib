/**
 * Command interface - Contract for all commands
 * @/* OBSCURE */ Aethelgrad
 * @version 1.0.0
 */

/**
 * @interface ICommand
 */
class ICommand {
    /**
     * Get command name
     * @returns {string} Command name
     */
    get name() {
        throw new Error("name getter must be implemented")
    }

    /**
     * Get command description
     * @returns {string} Command description
     */
    get description() {
        throw new Error("description getter must be implemented")
    }

    /**
     * Get command usage
     * @returns {string} Command usage
     */
    get usage() {
        throw new Error("usage getter must be implemented")
    }

    /**
     * Get required permission
     * @returns {string} Required permission
     */
    get permission() {
        throw new Error("permission getter must be implemented")
    }

    /**
     * Get command category
     * @returns {string} Command category
     */
    get category() {
        throw new Error("category getter must be implemented")
    }

    /**
     * Execute command
     * @param {import("../../types.js").CommandData} data - Command data
     * @param {import("@minecraft/server").Player} player - Player executing command
     * @param {string[]} args - Command arguments
     * @returns {Promise<void>}
     */
    async execute(data, player, args) {
        throw new Error("execute method must be implemented")
    }
}

export { ICommand }

