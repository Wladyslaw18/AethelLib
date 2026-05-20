/*
 * COMMAND_IDENTIFIER_REGISTRY
 * ----------------------------------------------------------------------------
 * A high-performance, O(1) hash-map store for every active command module. 
 * This is the single source of truth for the Ghost Interpreter's resolution 
 * logic.
 */

const commands = new Map(); // MASTER_COMMAND_BUFFER
const enums = new Map(); // MASTER_ENUM_BUFFER

export const CommandRegistry = {
    /**
     * Registers a custom command enum.
     */
    registerEnum: (name, values) => {
        enums.set(name, values);
    },

    /**
     * Gets a registered enum's values.
     */
    getEnum: (name) => {
        return enums.get(name);
    },

    /**
     * Gets all registered enum names.
     */
    getAllEnums: () => {
        return Array.from(enums.keys());
    },

    /**
     * Checks if a custom command enum is registered.
     */
    hasEnum: (name) => {
        return enums.has(name);
    },

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

            // Dynamically register aliases if they are defined on the command
            if (command.aliases && Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    const lowerAlias = alias.toLowerCase();
                    if (!commands.has(lowerAlias)) {
                        commands.set(lowerAlias, command);
                    } else {
                        console.warn(`[CommandRegistry] ALIAS COLLISION: Alias '${lowerAlias}' of command '${lowerName}' is already registered.`);
                    }
                }
            }
        } catch (error) {
            console.error(`[CommandRegistry] CRITICAL_REGISTRATION_FAILURE:`, error);
        }
    },

    /**
     * O(1)_QUERY_VECTOR
     */
    get: (name) => {
        let cleanName = name.toLowerCase();
        if (cleanName.includes(":")) {
            cleanName = cleanName.split(":")[1];
        }
        return commands.get(cleanName);
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
        let cleanName = name.toLowerCase();
        if (cleanName.includes(":")) {
            cleanName = cleanName.split(":")[1];
        }
        return commands.has(cleanName);
    },

    /**
     * MODULE_DECOMMISSION_VECTOR
     */
    unregister: (name) => {
        const lowerName = name.toLowerCase();
        const command = commands.get(lowerName);
        if (command) {
            commands.delete(lowerName);
            if (command.aliases && Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    commands.delete(alias.toLowerCase());
                }
            }
            return true;
        }
        return false;
    }
};
