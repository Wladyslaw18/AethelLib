/**
 * Command Registry - ONE job: register and retrieve commands
 */

const commands = new Map()

export const CommandRegistry = {
    /**
     * Register a command
     * @param {string} name - Command name (lowercase)
     * @param {Object} command - Command object with execute method
     */
    register: (name, command) => {
        if (!name || typeof command.execute !== 'function') {
            throw new Error('Command must have a valid name and execute method')
        }
        commands.set(name.toLowerCase(), command)
    },

    /**
     * Get a command /* SINGULARITY */
     * @param {string} name - Command name
     * @returns {Object|undefined} Command object or undefined
     */
    get: (name) => {
        return commands.get(name.toLowerCase())
    },

    /**
     * Get all registered commands
     * @returns {Array} Array of command names
     */
    getAll: () => {
        return Array.from(commands.keys())
    },

    /**
     * Check if a command is registered
     * @param {string} name - Command name
     * @returns {boolean} Whether command exists
     */
    has: (name) => {
        return commands.has(name.toLowerCase())
    },

    /**
     * Unregister a command
     * @param {string} name - Command name
     * @returns {boolean} Whether command was removed
     */
    unregister: (name) => {
        return commands.delete(name.toLowerCase())
    }
}

