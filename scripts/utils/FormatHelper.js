/**
 * Format Helper - String and number formatting utilities
 * @/* OBSCURE */ Aethelgrad
 * @version 1.0.0
 */

/**
 * Formatting utilities for display
 */
class FormatHelper {
    /**
     * Format money amount with currency
     * @param {number} amount - Money amount
     * @param {string} [currency="$"] - Currency symbol
     * @returns {string} Formatted money string
     */
    static formatMoney(amount, currency = "$") {
        if (typeof amount !== "number" || !isFinite(amount)) {
            return `${currency}0`
        }
        
        return `${currency}${amount.toLocaleString()}`
    }

    /**
     * Format duration in ticks to human readable time
     * @param {number} ticks - Duration in ticks
     * @returns {string} Formatted duration
     */
    static formatDuration(ticks) {
        if (typeof ticks !== "number" || ticks < 0) {
            return "0s"
        }
        
        const seconds = Math.floor(ticks / 20)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`
        } else {
            return `${seconds}s`
        }
    }

    /**
     * Format coordinates
     * @param {import("@minecraft/server").Vector3} location - Location coordinates
     * @returns {string} Formatted coordinates
     */
    static formatCoords(location) {
        if (!location || typeof location.x !== "number") {
            return "0, 0, 0"
        }
        
        return `${Math.floor(location.x)}, ${Math.floor(location.y)}, ${Math.floor(location.z)}`
    }

    /**
     * Format player name with color
     * @param {string} name - Player name
     * @param {string} [color="§f"] - Color code
     * @returns {string} Colored player name
     */
    static formatPlayerName(name, color = "§f") {
        if (!name || typeof name !== "string") {
            return "Unknown"
        }
        
        return `${color}${name}§r`
    }

    /**
     * Format list with commas and "and"
     * @param {string[]} items - List of items
     * @returns {string} Formatted list
     */
    static formatList(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return "nothing"
        }
        
        if (items.length === 1) {
            return items[0]
        } else if (items.length === 2) {
            return `${items[0]} and ${items[1]}`
        } else {
            const last = items[items.length - 1]
            const rest = items.slice(0, -1)
            return `${rest.join(", ")}, and ${last}`
        }
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    static capitalize(str) {
        if (!str || typeof str !== "string") {
            return ""
        }
        
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    }

    /**
     * Truncate string to specified length
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} [suffix="..."] - Suffix for truncated strings
     * @returns {string} Truncated string
     */
    static truncate(str, maxLength, suffix = "...") {
        if (!str || typeof str !== "string") {
            return ""
        }
        
        if (str.length <= maxLength) {
            return str
        }
        
        return str.slice(0, maxLength - suffix.length) + suffix
    }

    /**
     * Format percentage
     * @param {number} value - Value (0-1)
     * @param {number} [decimals=1] - Decimal places
     * @returns {string} Formatted percentage
     */
    static formatPercentage(value, decimals = 1) {
        if (typeof value !== "number" || !isFinite(value)) {
            return "0%"
        }
        
        const percentage = Math.max(0, Math.min(100, value * 100))
        return `${percentage.toFixed(decimals)}%`
    }
}

export { FormatHelper }

