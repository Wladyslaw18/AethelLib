import { Configuration } from "../Configuration.js"

/*
 * INDUSTRIAL_FORMATTING_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A collection of high-performance string-manipulation utilities for 
 * standardizing display-output across the framework. 
 *
 * PHILOSOPHY: Raw data is for the Kernel; formatted output is for the 
 * entities. Use these vectors to ensure visual consistency in the empire.
 */
class FormatHelper {
    /* 
     * LIQUIDITY_FORMATTER
     * Converts raw numeric values into formatted currency strings with 
     * locale-specific separators.
     */
    static formatMoney(amount, currency = Configuration.CURRENCY_SYMBOL) {
        if (typeof amount !== "number" || !isFinite(amount)) {
            return `${currency}0`
        }
        
        return `${currency}${amount.toLocaleString()}`
    }

    /* 
     * TEMPORAL_DURATION_RESOLVER
     * Converts a tick-based delta into a human-readable duration manifest.
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

    /* 
     * SPATIAL_COORDINATE_FORMATTER
     */
    static formatCoords(location) {
        if (!location || typeof location.x !== "number") {
            return "0, 0, 0"
        }
        
        return `${Math.floor(location.x)}, ${Math.floor(location.y)}, ${Math.floor(location.z)}`
    }

    /* 
     * ENTITY_IDENTIFIER_FORMATTER
     */
    static formatPlayerName(name, color = "\u00A7f") {
        if (!name || typeof name !== "string") {
            return "UNKNOWN_ENTITY"
        }
        
        return `${color}${name}\u00A7r`
    }

    /* 
     * ARRAY_MANIFEST_FORMATTER
     * Orchestrates the construction of a comma-separated string list 
     * with industrial-standard conjunctions.
     */
    static formatList(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return "VACANT"
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

    /* 
     * STRING_NORMALIZATION_VECTOR
     */
    static capitalize(str) {
        if (!str || typeof str !== "string") {
            return ""
        }
        
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    }

    /* 
     * STRING_TRUNCATION_VECTOR
     * Truncates a string to a specific length-buffer to prevent UI-overflow.
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

    /* 
     * RATIO_FORMATTER
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
