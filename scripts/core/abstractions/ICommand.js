/*
 * ICOMMAND_CONTRACT_INTERFACE
 * ----------------------------------------------------------------------------
 * This is the master interface for the Command Architecture. Any module 
 * attempting to register with the CommandRegistry MUST satisfy these 
 * getters and methods.
 *
 * PHILOSOPHY: If you don't implement these, the registry will throw a 
 * Runtime Error and crash the boot sequence. This is a design-time 
 * contract to prevent 'half-baked' commands from entering the ecosystem.
 */

class ICommand {
    /**
     * Primary key identifier for command resolution.
     * 
     * GUARANTEES:
     * - Returns the lowercase alphanumeric token of the command name.
     */
    get name() {
        throw new Error("[ContractViolation] 'name' getter is non-optional.");
    }

    /**
     * Plain english description of command function.
     * 
     * GUARANTEES:
     * - Returns the instruction sentence string for help manuals.
     */
    get description() {
        throw new Error("[ContractViolation] 'description' getter is non-optional.");
    }

    /**
     * Syntax template string for command inputs.
     * 
     * GUARANTEES:
     * - Returns the usage syntax template (e.g. "/ae:pay <player> <amount>").
     */
    get usage() {
        throw new Error("[ContractViolation] 'usage' getter is non-optional.");
    }

    /**
     * RBAC authority permission node required.
     * 
     * GUARANTEES:
     * - Returns the namespaced string dot path representing the required permission.
     */
    get permission() {
        throw new Error("[ContractViolation] 'permission' getter is non-optional.");
    }

    /**
     * Categorization tag for command listing grouping.
     * 
     * GUARANTEES:
     * - Returns the grouping category name string.
     */
    get category() {
        throw new Error("[ContractViolation] 'category' getter is non-optional.");
    }

    /**
     * Execution pathway trigger for the command.
     * 
     * EXPECTS:
     * - data: The internal command metadata context.
     * - player: The native Player object executing the command.
     * - args: Array of parsed string arguments.
     * 
     * GUARANTEES:
     * - Executes state-changes or UI displays representing the command execution.
     * 
     * @param {any} data - Internal command metadata.
     * @param {import("@minecraft/server").Player} player - Executor player.
     * @param {string[]} args - Executed arguments list.
     */
    async execute(data, player, args) {
        void data; void player; void args;
        throw new Error("[ContractViolation] 'execute' method is non-optional.");
    }
}

export { ICommand };
