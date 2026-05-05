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
    /* 
     * IDENTIFIER_TOKEN
     * The primary key used for command resolution in the O(1) Map. 
     */
    get name() {
        throw new Error("[ContractViolation] 'name' getter is non-optional.");
    }

    /* 
     * METADATA_DESCRIPTION
     * Raw string used for the help-manual generation. 
     */
    get description() {
        throw new Error("[ContractViolation] 'description' getter is non-optional.");
    }

    /* 
     * SYNTAX_HINT
     * The usage string displayed during incorrect parameter input. 
     */
    get usage() {
        throw new Error("[ContractViolation] 'usage' getter is non-optional.");
    }

    /* 
     * PERMISSION_NODE
     * The auth-node required for the RBAC handshake. 
     */
    get permission() {
        throw new Error("[ContractViolation] 'permission' getter is non-optional.");
    }

    /* 
     * REGISTRY_CATEGORY
     * Used for grouping commands in the /help UI. 
     */
    get category() {
        throw new Error("[ContractViolation] 'category' getter is non-optional.");
    }

    /*
     * EXECUTION_LOGIC_GATE
     * ----------------------------------------------------------------------------
     * The entry point for the command execution. This method handles the 
     * transformation of raw strings into actual game-state changes. 
     *
     * @param {Object} data - The internal command metadata.
     * @param {Player} player - The originating actor.
     * @param {string[]} args - The raw parameter array.
     */
    async execute(data, player, args) {
        void data; void player; void args;
        throw new Error("[ContractViolation] 'execute' method is non-optional.");
    }
}

export { ICommand }
