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
    /*
     * MODULE_DOCKING_VECTOR
     * Registers a command into the master buffer. Validates that the 
     * command satisfies the execution contract before ingestion.
     *
     * @param {string} name - The unique identifier.
     * @param {Object} command - The module instance.
     */
    register: (name, command) => {
        if (!name || typeof command.execute !== 'function') {
            throw new Error('[CommandRegistry] CONTRACT_VIOLATION: Missing identifier or execution logic.');
        }
        commands.set(name.toLowerCase(), command)
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
