/**
 * types.js - Shared JSDoc type definitions for Aethelgrad Essentials
 * These are typedef-only definitions used for IDE type checking.
 * No runtime values are exported.
 */

/**
 * @typedef {Object} CommandData
 * @property {string} command - The command name that was executed
 * @property {string[]} args - Arguments passed to the command
 * @property {import("@minecraft/server").Player} player - The player who ran the command
 */

/**
 * @typedef {Object} SystemConfig
 * @property {string} [name] - System name
 * @property {boolean} [enabled] - Whether the system is enabled
 * @property {number} [tickInterval] - Tick interval for update calls
 */

export {}
