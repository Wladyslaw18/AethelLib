/**
 * Color System - CubeCraft Style Chat Colors with Permission Support
 * Handles player chat colors, formatting, and permission-based access
 */

import { Kernel } from "../../../core/Kernel.js"
import { ActionFormData } from "@minecraft/server-ui"

export class ColorSystem {
    static COLORS = {
        "black": "\xA70", "dark_blue": "\xA71", "dark_green": "\xA72",
        "dark_aqua": "\xA73", "dark_red": "\xA74", "dark_purple": "\xA75",
        "gold": "\xA76", "gray": "\xA77", "dark_gray": "\xA78",
        "blue": "\xA79", "green": "\xA7a", "aqua": "\xA7b",
        "red": "\xA7c", "light_purple": "\xA7d", "yellow": "\xA7e",
        "white": "\xA7f", "rainbow": "\xA7k", "bold": "\xA7l",
        "strikethrough": "\xA7m", "underline": "\xA7n", "italic": "\xA7o",
        "reset": "\xA7r"
    }
    
    static COLOR_PERMISSIONS = {
        "black": "chat.color.black",
        "dark_blue": "chat.color.dark_blue", 
        "dark_green": "chat.color.dark_green",
        "dark_aqua": "chat.color.dark_aqua",
        "dark_red": "chat.color.dark_red",
        "dark_purple": "chat.color.dark_purple",
        "gold": "chat.color.gold",
        "gray": "chat.color.gray",
        "dark_gray": "chat.color.dark_gray",
        "blue": "chat.color.blue",
        "green": "chat.color.green",
        "aqua": "chat.color.aqua",
        "red": "chat.color.red",
        "light_purple": "chat.color.light_purple",
        "yellow": "chat.color.yellow",
        "white": "chat.color.white",
        "rainbow": "chat.color.rainbow",
        "bold": "chat.format.bold",
        "strikethrough": "chat.format.strikethrough",
        "underline": "chat.format.underline",
        "italic": "chat.format.italic"
    }
    
    /**
     * Get player's current chat color
     * @param {import("@minecraft/server").Player} player - Player to check
     * @returns {string} Color code
     */
    static getPlayerColor(player) {
        const PlayerStore = Kernel.get("playerStore")
        const savedColor = PlayerStore.get(player, "chatColor")
        if (savedColor && this.canUseColor(player, savedColor)) {
            return this.COLORS[savedColor] || this.COLORS.white
        }
        return this.getRankDefaultColor(player)
    }

    /**
     * Get rank's default color
     * @param {import("@minecraft/server").Player} player - Player to check
     * @returns {string} Color code
     */
    static getRankDefaultColor(player) {
        const PermissionManager = Kernel.get("permissions")
        const highestRank = PermissionManager.getHighestRank(player)
        return highestRank?.chatColor || this.COLORS.gray
    }
    
    /**
     * Check if player can use a specific color
     * @param {import("@minecraft/server").Player} player - Player to check
     * @param {string} color - Color name
     * @returns {boolean} Whether player can use the color
     */
    static canUseColor(player, color) {
        const PermissionManager = Kernel.get("permissions")
        // Everyone can use default colors
        if (color === "white" || color === "gray" || color === "reset") {
            return true
        }
        
        // Check special color permissions
        const permission = this.COLOR_PERMISSIONS[color]
        if (permission) {
            return PermissionManager.hasPermission(player, permission)
        }
        
        // Check if player has general color permission
        if (PermissionManager.hasPermission(player, "chat.color.*")) {
            return true
        }
        
        return false
    }
    
    /**
     * Format message with color code
     * @param {string} message - Message to format
     * @param {string} colorCode - Color code
     * @returns {string} Formatted message
     */
    static formatWithColor(message, colorCode) {
        if (colorCode === "\xA7k") { // Rainbow effect
            return this.createRainbowText(message)
        }
        return `${colorCode}${message}\xA7r`
    }
    
    /**
     * Create rainbow text effect
     * @param {string} message - Message to make rainbow
     * @returns {string} Rainbow formatted message
     */
    static createRainbowText(message) {
        const rainbowColors = ["\xA7c", "\xA76", "\xA7e", "\xA7a", "\xA7b", "\xA79", "\xA7d"]
        let result = ""
        
        const truncated = message.substring(0, 200);
        for (let i = 0; i < truncated.length; i++) {
            const colorIndex = i % rainbowColors.length
            result += rainbowColors[colorIndex] + truncated[i]
        }
        
        return result + "\xA7r"
    }
    
    /**
     * Format chat message with player's color
     * @param {import("@minecraft/server").Player} player - Player sending message
     * @param {string} message - Message content
     * @returns {string} Formatted chat message
     */
    static formatChatMessage(player, message) {
        const playerColor = this.getPlayerColor(player)
        const rankPrefix = this.getRankPrefix(player)
        
        const formattedMessage = this.formatWithColor(message, playerColor)
        return `${rankPrefix} ${playerColor}${player.name}\xA7f: ${formattedMessage}`
    }
    
    /**
     * Get player's rank prefix with colors
     * @param {import("@minecraft/server").Player} player - Player to check
     * @returns {string} Rank prefix
     */
    static getRankPrefix(player) {
        const PermissionManager = Kernel.get("permissions")
        const highestRank = PermissionManager.getHighestRank(player)
        
        if (highestRank) {
            return `${highestRank.color || "\xA77"}[${highestRank.name}]`
        }
        
        return "\xA77[Default]"
    }
    
    /**
     * Set player's chat color
     * @param {import("@minecraft/server").Player} player - Player to set color for
     * @param {string} color - Color name
     * @returns {boolean} Success status
     */
    static setPlayerColor(player, color) {
        if (!this.COLORS[color]) {
            player.sendMessage(`\xA7cInvalid color: \xA7e${color}`)
            return false
        }
        
        if (!this.canUseColor(player, color)) {
            player.sendMessage(`\xA7cYou cannot use color: \xA7e${color}`)
            return false
        }
        
        const PlayerStore = Kernel.get("playerStore")
        PlayerStore.set(player, "chatColor", color)
        player.sendMessage(`\xA7aChat color changed to ${this.COLORS[color]}${color}\xA7a`)
        return true
    }
    
    /**
     * Get available colors for player
     * @param {import("@minecraft/server").Player} player - Player to check
     * @returns {Array} Available color names
     */
    static getAvailableColors(player) {
        const PermissionManager = Kernel.get("permissions")
        const colors = ["white", "gray"] // Everyone can use these
        
        for (const [colorName, permission] of Object.entries(this.COLOR_PERMISSIONS)) {
            if (PermissionManager.hasPermission(player, permission)) {
                colors.push(colorName)
            }
        }
        
        // Add wildcard color permission
        if (PermissionManager.hasPermission(player, "chat.color.*")) {
            colors.push(...Object.keys(this.COLORS).filter(c => !colors.includes(c)))
        }
        
        return colors.sort()
    }
    
    /**
     * Show color selection UI to player
     * @param {import("@minecraft/server").Player} player - Player to show UI to
     */
    static async showColorSelection(player) {
        const availableColors = this.getAvailableColors(player)
        const PlayerStore = Kernel.get("playerStore")
        const currentColor = PlayerStore.get(player, "chatColor") || "white"
        
        const form = new ActionFormData()
            .title("\xA76\xA7lChat Color Selection")
            .body(`\xA77Current color: ${this.COLORS[currentColor]}${currentColor}\n\xA77Select a new color:`)
        
        // Add color buttons
        availableColors.forEach(color => {
            const isCurrent = color === currentColor
            const icon = this.getColorIcon(color)
            const label = `${isCurrent ? "\xA7a✓ " : "\xA77○ "}${this.COLORS[color]}${color}`
            form.button(label, icon)
        })
        
        form.button("\xA7cReset to Default", "textures/ui/cancel")
        
        // @ts-ignore
        const response = await form.show(player)
        if (response.canceled) return
        
        if (response.selection === availableColors.length) {
            // Reset to default
            const PlayerStore = Kernel.get("playerStore")
            PlayerStore.delete(player, "chatColor")
            player.sendMessage("\xA7aChat color reset to default")
        } else if (response.selection < availableColors.length) {
            const selectedColor = availableColors[response.selection]
            this.setPlayerColor(player, selectedColor)
        }
    }
    
    /**
     * Get texture icon for color
     * @param {string} color - Color name
     * @returns {string} Texture path
     */
    static getColorIcon(color) {
        const iconMap = {
            "black": "textures/ui/black",
            "dark_blue": "textures/ui/dark_blue", 
            "dark_green": "textures/ui/dark_green",
            "dark_aqua": "textures/ui/dark_aqua",
            "dark_red": "textures/ui/dark_red",
            "dark_purple": "textures/ui/dark_purple",
            "gold": "textures/ui/gold",
            "gray": "textures/ui/gray",
            "dark_gray": "textures/ui/dark_gray",
            "blue": "textures/ui/blue",
            "green": "textures/ui/green",
            "aqua": "textures/ui/aqua",
            "red": "textures/ui/red",
            "light_purple": "textures/ui/light_purple",
            "yellow": "textures/ui/yellow",
            "white": "textures/ui/white",
            "rainbow": "textures/ui/rainbow",
            "bold": "textures/ui/bold",
            "strikethrough": "textures/ui/strikethrough",
            "underline": "textures/ui/underline",
            "italic": "textures/ui/italic"
        }
        
        return iconMap[color] || "textures/ui/default"
    }
    
    /**
     * Process message for color codes (with permission checks)
     * @param {import("@minecraft/server").Player} player - Player sending message
     * @param {string} message - Raw message
     * @returns {string} Processed message
     */
    static processMessage(player, message) {
        // Check for manual color codes in message
        const colorCodeMatch = message.match(/\xA7([0-9a-fk-or])/g)
        
        if (colorCodeMatch) {
            // Player is trying to use manual color codes
            const PermissionManager = Kernel.get("permissions")
            if (!PermissionManager.hasPermission(player, "chat.color.manual")) {
                // Strip color codes if not allowed
                return message.replace(/\xA7[0-9a-fk-or]/g, "")
            }
        }
        
        return message
    }
    
    /**
     * Get color statistics
     * @returns {Object} Color usage statistics
     */
    static getStats() {
        return {
            totalColors: Object.keys(this.COLORS).length,
            colorPermissions: Object.keys(this.COLOR_PERMISSIONS).length
        }
    }
}

