/**
 * Validation Helper - Input validation utilities
 * @/* NEXUS */ Aethelgrad
 * @version 1.0.0
 */

/**
 * Input validation and sanitization utilities
 */
class ValidationHelper {
    /**
     * Validate player name
     * @param {string} name - Player name to validate
     * @returns {boolean} Whether name is valid
     */
    static isValidPlayerName(name) {
        if (!name || typeof name !== "string") {
            return false
        }
        
        // Minecraft player names: 3-16 characters, alphanumeric + underscores
        const nameRegex = /^[a-zA-Z0-9_]{3,16}$/
        return nameRegex.test(name)
    }

    /**
     * Validate coordinate values
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @param {number} z - Z coordinate
     * @returns {boolean} Whether coordinates are valid
     */
    static isValidCoordinates(x, y, z) {
        if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") {
            return false
        }
        
        // Minecraft coordinate limits
        return (
            isFinite(x) && isFinite(y) && isFinite(z) &&
            x >= -30000000 && x <= 30000000 &&
            y >= -64 && y <= 320 &&
            z >= -30000000 && z <= 30000000
        )
    }

    /**
     * Validate money amount
     * @param {number} amount - Money amount to validate
     * @returns {boolean} Whether amount is valid
     */
    static isValidMoney(amount) {
        return (
            typeof amount === "number" &&
            isFinite(amount) &&
            amount >= 0 &&
            amount <= Number.MAX_SAFE_INTEGER
        )
    }

    /**
     * Validate home/warp name
     * @param {string} name - Name to validate
     * @returns {boolean} Whether name is valid
     */
    static isValidLocationName(name) {
        if (!name || typeof name !== "string") {
            return false
        }
        
        // Location names: 1-32 characters, alphanumeric + spaces + underscores + hyphens
        const nameRegex = /^[a-zA-Z0-9 _-]{1,32}$/
        return nameRegex.test(name.trim())
    }

    /**
     * Validate chat message
     * @param {string} message - Message to validate
     * @returns {boolean} Whether message is valid
     */
    static isValidChatMessage(message) {
        if (!message || typeof message !== "string") {
            return false
        }
        
        const trimmed = message.trim()
        
        // Chat messages: 1-256 characters
        return (
            trimmed.length > 0 &&
            trimmed.length <= 256 &&
            !trimmed.includes('\n') &&
            !trimmed.includes('\r')
        )
    }

    /**
     * Validate command arguments
     * @param {string[]} args - Command arguments
     * @param {number} [minArgs=0] - Minimum required arguments
     * @param {number} [maxArgs=Infinity] - Maximum allowed arguments
     * @returns {boolean} Whether arguments are valid
     */
    static isValidArguments(args, minArgs = 0, maxArgs = Infinity) {
        if (!Array.isArray(args)) {
            return false
        }
        
        const validArgs = args.filter(arg => arg && typeof arg === "string" && arg.trim().length > 0)
        return validArgs.length >= minArgs && validArgs.length <= maxArgs
    }

    /**
     * Sanitize string input
     * @param {string} input - Input to sanitize
     * @param {number} [maxLength=256] - Maximum length
     * @returns {string} Sanitized string
     */
    static sanitizeString(input, maxLength = 256) {
        if (!input || typeof input !== "string") {
            return ""
        }
        
        return input
            .trim()
            .slice(0, maxLength)
            .replace(/[\r\n\t]/g, " ")
            .replace(/ {2,}/g, " ")
    }

    /**
     * Validate dimension ID
     * @param {string} dimension - Dimension ID to validate
     * @returns {boolean} Whether dimension is valid
     */
    static isValidDimension(dimension) {
        if (!dimension || typeof dimension !== "string") {
            return false
        }
        
        const validDimensions = [
            "minecraft:overworld",
            "minecraft:nether", 
            "minecraft:the_end"
        ]
        
        return validDimensions.includes(dimension)
    }

    /**
     * Validate item ID
     * @param {string} itemId - Item ID to validate
     * @returns {boolean} Whether item ID is valid
     */
    static isValidItemId(itemId) {
        if (!itemId || typeof itemId !== "string") {
            return false
        }
        
        // Basic Minecraft item ID format: namespace:item_name
        const itemRegex = /^[a-z0-9_.-]+:[a-z0-9_.-]+$/
        return itemRegex.test(itemId)
    }

    /**
     * Validate permission string
     * @param {string} permission - Permission to validate
     * @returns {boolean} Whether permission is valid
     */
    static isValidPermission(permission) {
        if (!permission || typeof permission !== "string") {
            return false
        }
        
        // Permission format: category.action or just action
        const permissionRegex = /^[a-z0-9_.-]+(\.[a-z0-9_.-]+)?$/
        return permissionRegex.test(permission)
    }

    /**
     * Validate color code
     * @param {string} colorCode - Color code to validate
     * @returns {boolean} Whether color code is valid
     */
    static isValidColorCode(colorCode) {
        if (!colorCode || typeof colorCode !== "string") {
            return false
        }
        
        // Minecraft color codes: §0-§9, §a-§f, §k-§o, §r
        const colorRegex = /^§[0-9a-fk-or]$/
        return colorRegex.test(colorCode)
    }
}

export { ValidationHelper }

