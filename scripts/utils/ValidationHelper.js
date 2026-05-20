/*
 * INDUSTRIAL_DATA_VALIDATOR
 * ----------------------------------------------------------------------------
 * A collection of high-performance validation vectors for ensuring the 
 * integrity of industrial data-packets. Implements regex-based scanning 
 * and boundary-checks for entity identifiers, coordinates, and 
 * economic buffers.
 *
 * PHILOSOPHY: Garbage in, system crash out. Every input is a threat 
 * until it passes the validation handshake.
 */
class ValidationHelper {
    /* 
     * ENTITY_IDENTIFIER_VALIDATOR
     * Enforces the native 3-16 character alphanumeric constraint.
     */
    static isValidPlayerName(name) {
        if (!name || typeof name !== "string") {
            return false
        }
        
        const nameRegex = /^[a-zA-Z0-9_]{3,16}$/
        return nameRegex.test(name)
    }

    /* 
     * SPATIAL_COORDINATE_VALIDATOR
     * Enforces industrial boundaries to prevent spatial overflows or 
     * void-leakage.
     */
    static isValidCoordinates(x, y, z) {
        if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") {
            return false
        }
        
        return (
            isFinite(x) && isFinite(y) && isFinite(z) &&
            x >= -30000000 && x <= 30000000 &&
            y >= -64 && y <= 320 &&
            z >= -30000000 && z <= 30000000
        )
    }

    /* 
     * LIQUIDITY_BUFFER_VALIDATOR
     */
    static isValidMoney(amount) {
        return (
            typeof amount === "number" &&
            isFinite(amount) &&
            amount >= 0 &&
            amount <= Number.MAX_SAFE_INTEGER
        )
    }

    /* 
     * LOCATION_LABEL_VALIDATOR
     */
    static isValidLocationName(name) {
        if (!name || typeof name !== "string") {
            return false
        }
        
        const nameRegex = /^[a-zA-Z0-9 _-]{1,32}$/
        return nameRegex.test(name.trim())
    }

    /* 
     * COMMUNICATION_PACKET_VALIDATOR
     */
    static isValidChatMessage(message) {
        if (!message || typeof message !== "string") {
            return false
        }
        
        const trimmed = message.trim()
        
        return (
            trimmed.length > 0 &&
            trimmed.length <= 256 &&
            !trimmed.includes('\n') &&
            !trimmed.includes('\r')
        )
    }

    /* 
     * ARGUMENT_BUFFER_VALIDATOR
     */
    static isValidArguments(args, minArgs = 0, maxArgs = Infinity) {
        if (!Array.isArray(args)) {
            return false
        }
        
        const validArgs = args.filter(arg => arg && typeof arg === "string" && arg.trim().length > 0)
        return validArgs.length >= minArgs && validArgs.length <= maxArgs
    }

    /* 
     * INPUT_SANITIZATION_VECTOR
     * Purges carriage-returns and redundant whitespace from input buffers.
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

    /* 
     * DIMENSION_MANIFEST_VALIDATOR
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

    /* 
     * ASSET_IDENTIFIER_VALIDATOR
     */
    static isValidItemId(itemId) {
        if (!itemId || typeof itemId !== "string") {
            return false
        }
        
        const itemRegex = /^[a-z0-9_.-]+:[a-z0-9_.-]+$/
        return itemRegex.test(itemId)
    }

    /* 
     * AUTH_CLEARANCE_VALIDATOR
     */
    static isValidPermission(permission) {
        if (!permission || typeof permission !== "string") {
            return false
        }
        
        const permissionRegex = /^[a-z0-9_.-]+(\.[a-z0-9_.-]+)?$/
        return permissionRegex.test(permission)
    }

    /* 
     * COLOR_TOKEN_VALIDATOR
     */
    static isValidColorCode(colorCode) {
        if (!colorCode || typeof colorCode !== "string") {
            return false
        }
        
        const colorRegex = /^\u00A7[0-9a-fk-or]$/
        return colorRegex.test(colorCode)
    }
}

export { ValidationHelper }
