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

/**
 * @typedef {Object} CommandParameter
 * @property {string} name - Parameter name
 * @property {string|import("@minecraft/server").CustomCommandParamType} type - Parameter type (e.g. "player", "string", "int", "float", etc.)
 * @property {boolean} [optional] - Whether the parameter is optional
 * @property {string} [enumName] - Namespaced enum name if type is Enum
 * @property {string} [enum] - Alias for enumName
 */

/**
 * @typedef {Object} CommandDefinition
 * @property {string} name - Command identifier token
 * @property {string} description - Command description for help manual
 * @property {string} usage - Usage string displayed during incorrect parameter input
 * @property {string} permission - RBAC permission node required
 * @property {string} category - Command category for grouping in help UI
 * @property {boolean} [native] - Whether the command is registered natively
 * @property {boolean} [chatRaw] - Intercepted via chat events only
 * @property {CommandParameter[]} [parameters] - List of parameters for native commands
 * @property {CommandParameter[]} [params] - Parameter list alias
 * @property {string[]} [aliases] - Alternative names for the command
 * @property {function(any, import("@minecraft/server").Player, any[]): (Promise<void>|void)} [execute] - Primary execution callback
 * @property {function({ sourceEntity: import("@minecraft/server").Player, sourceType: string, vector: string }, any[]): (Promise<void>|void)} [callback] - Alternate dispatch execution callback
 */

/**
 * @typedef {Object} PrivateMessagePacket
 * @property {string} sender - Name of the sending player
 * @property {string} senderId - Unique ID of the sending player
 * @property {string} receiver - Name of the receiving player
 * @property {string} receiverId - Unique ID of the receiving player
 * @property {string} content - Raw message text sent
 * @property {number} timestamp - Unix epoch millisecond timestamp when sent
 */

/**
 * @typedef {Object} ShopDefinition
 * @property {string} ownerId - Unique ID of the shop owner
 * @property {string} ownerName - Display name of the shop owner
 * @property {string} itemId - Minecraft item type ID (e.g., "minecraft:diamond")
 * @property {number} price - Cost or reward per item unit
 * @property {number} quantity - Quantity of items transferred per trade
 * @property {string} type - Transaction type: "buy" or "sell"
 * @property {import("@minecraft/server").Vector3} chestLocation - World location of the linked chest container
 * @property {import("@minecraft/server").Vector3} signLocation - World location of the interactable shop sign
 * @property {number} [created] - Unix epoch millisecond timestamp of shop creation
 */

/**
 * @typedef {Object} ClaimData
 * @property {string} ownerId - Unique ID of the land claim owner
 * @property {Record<string, number>} trusted - Map of trusted player IDs to permission bitmasks
 * @property {number} [flags] - Bitmask flags for claim configuration settings
 */

/**
 * @typedef {Object} Home
 * @property {number} x - Block coordinate x of home location
 * @property {number} y - Block coordinate y of home location
 * @property {number} z - Block coordinate z of home location
 * @property {string} dimension - Dimension ID (e.g., "minecraft:overworld")
 * @property {number} [created] - Unix epoch millisecond timestamp when home was set
 */

/**
 * @typedef {Object} Warp
 * @property {number} x - Block coordinate x of warp location
 * @property {number} y - Block coordinate y of warp location
 * @property {number} z - Block coordinate z of warp location
 * @property {string} dimension - Dimension ID (e.g., "minecraft:overworld")
 * @property {string} creator - Name or ID of the warp creator
 * @property {number} [created] - Unix epoch millisecond timestamp when warp was set
 */

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} name - Player display name
 * @property {number} balance - Current credit balance of the player
 */

/**
 * @typedef {Object} WalEntry
 * @property {string} senderId - Unique ID of the money sender
 * @property {string} receiverId - Unique ID of the money receiver
 * @property {number} amount - Amount of currency to transfer
 * @property {number} senderOriginalBalance - Original balance of the sender
 * @property {number} receiverOriginalBalance - Original balance of the receiver
 * @property {number} timestamp - Unix epoch millisecond timestamp of WAL entry write
 */

export {}
