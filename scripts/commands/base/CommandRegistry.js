/*
 * COMMAND_IDENTIFIER_REGISTRY
 * ----------------------------------------------------------------------------
 * A high-performance, O(1) hash-map store for every active command module. 
 * This is the single source of truth for the Ghost Interpreter's resolution 
 * logic.
 *
 * PHILOSOPHY: All keys are stored in lowercase to ensure case-insensitive 
 * lookup consistency across different input vectors (Chat vs Native).
 */

const commands = new Map() // MASTER_COMMAND_BUFFER

export const CommandRegistry = {
    /**
     * Registers a command module.
     * Supports both (name, module) and (module) signatures.
     */
    register: (arg1, arg2) => {
        const command = arg2 || arg1;
        const name = arg2 ? arg1 : command.name;

        if (!name || typeof command.execute !== 'function') {
            throw new Error(`[CommandRegistry] Invalid command registration for '${name}'`);
        }
        commands.set(name.toLowerCase(), command);
    },


    /* 
     * O(1)_QUERY_VECTOR
     */
    get: (name) => {
        return commands.get(name.toLowerCase())
    },

    /* 
     * MANIFEST_ACCESSOR
     */
    getAll: () => {
        return Array.from(commands.keys())
    },

    /* 
     * IDENTIFIER_PROBE
     */
    has: (name) => {
        return commands.has(name.toLowerCase())
    },

    /* 
     * MODULE_DECOMMISSION_VECTOR
     */
    unregister: (name) => {
        return commands.delete(name.toLowerCase())
    }
}
