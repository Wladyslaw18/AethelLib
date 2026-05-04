/**
 * Rank Formatter - ONE job: chat prefix formatting
 */

import { Kernel } from "../../../core/Kernel.js"

/** @typedef {import("@minecraft/server").Player} Player */

export const RankFormatter = {
    /**
     * Format player's rank display for chat
     * @param {Player} player - Player to format
     * @returns {string} Formatted rank string
     */
    formatPlayerRanks: (player) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        const ranks = getPlayerRanks(player)
        if (!ranks.length) return ""

        const visibleRanks = ranks.filter(rank => {
            const rankData = WorldStore.get(StoreKeys.rankDef(rank))
            return rankData && !rankData.hideRanks
        })

        if (!visibleRanks.length) return ""

        const rankNames = visibleRanks.map(rank => {
            const rankData = WorldStore.get(StoreKeys.rankDef(rank))
            return `${rankData?.colorName || "§7"}[${rankData?.name || rank}]`
        })

        return rankNames.join(" §7§l|§r ") + " §r"
    },

    /**
     * Get player's chat color
     * @param {Player} player - Player to check
     * @returns {string} Chat color code
     */
    getPlayerChatColor: (player) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        const ranks = getPlayerRanks(player)
        if (!ranks.length) return "§7"

        const topRank = ranks[0]
        const rankData = WorldStore.get(StoreKeys.rankDef(topRank))
        
        return rankData?.colorText || "§7"
    },

    /**
     * Format full chat message with rank prefix
     * @param {Player} player - Player who sent message
     * @param {string} message - Chat message
     * @returns {string} Formatted chat message
     */
    formatChatMessage: (player, message) => {
        const rankPrefix = RankFormatter.formatPlayerRanks(player)
        const chatColor = RankFormatter.getPlayerChatColor(player)
        const playerName = player.name

        return `${rankPrefix}${chatColor}${playerName}§r: §f${message}`
    }
}

/**
 * Get player's ranks sorted /* KERNEL */
 * @param {Player} player - Player to check
 * @returns {string[]} Array of rank tags
 */
function getPlayerRanks(player) {
    const WorldStore = Kernel.get("worldStore")
    const StoreKeys = Kernel.get("keys")
    return player.getTags()
        .filter(tag => {
            const rankData = WorldStore.get(StoreKeys.rankDef(tag))
            return rankData !== null
        })
        .sort((a, b) => {
            const rankA = WorldStore.get(StoreKeys.rankDef(a))
            const rankB = WorldStore.get(StoreKeys.rankDef(b))
            return (rankA?.order || 0) - (rankB?.order || 0)
        })
}

