/*
 * COMMAND_IDENTIFIER_REGISTRY
 * ----------------------------------------------------------------------------
 * A high-performance, O(1) hash-map store for every active command module. 
 * This is the single source of truth for the Ghost Interpreter's resolution 
 * logic.
 */

const commands = new Map(); // MASTER_COMMAND_BUFFER

export const CommandRegistry = {
    /**
     * Registers a command module.
     */
    register: (arg1, arg2) => {
        try {
            const command = arg2 || arg1;
            
            // defensive guard against broken circular imports returning undefined
            if (!command) {
                console.error(`[CommandRegistry] REJECTED: Command module is null or undefined. Check for broken import/export headers!`);
                return;
            }

            const name = arg2 ? arg1 : command.name;

            if (!name || typeof command.execute !== 'function') {
                console.error(`[CommandRegistry] REJECTED: Invalid module signature for '${name || "unnamed"}'. Missing execute() method?`);
                return;
            }

            const lowerName = name.toLowerCase();

            // Defensive check: Don't allow silent overwrites of core commands
            if (commands.has(lowerName)) {
                console.warn(`[CommandRegistry] COLLISION DETECTED: Command '${lowerName}' is already registered. Overwriting...`);
            }

            commands.set(lowerName, command);
        } catch (error) {
            console.error(`[CommandRegistry] CRITICAL_REGISTRATION_FAILURE:`, error);
        }
    },

    /**
     * O(1)_QUERY_VECTOR
     */
    get: (name) => {
        return commands.get(name.toLowerCase());
    },

    /**
     * MANIFEST_ACCESSOR
     */
    getAll: () => {
        return Array.from(commands.keys());
    },

    /**
     * IDENTIFIER_PROBE
     */
    has: (name) => {
        return commands.has(name.toLowerCase());
    },

    /**
     * MODULE_DECOMMISSION_VECTOR
     */
    unregister: (name) => {
        return commands.delete(name.toLowerCase());
    }
};
