/**
 * Rank Command - Shows player's current rank
 */

import { RankFormatter } from "../../../systems/social/ranks/RankFormatter.js"
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js"
import { WorldStore } from "../../../core/store/WorldStore.js"
import { StoreKeys } from "../../../core/store/StoreKeys.js"

export const RankCommand = {
    name: "rank",
    description: "View your current rank and permissions",

    /**
     * Execute rank command
     * @param {Player} player - Command executor
     * @param {string[]} args - Command arguments
     */
    execute: (player, args) => {
        const ranks = getPlayerRanks(player)

        if (!ranks.length) {
            player.sendMessage("§cYou don't have any ranks. Defaulting to Member.")
            // Give default rank
            player.addTag("member")
            showRankInfo(player, ["member"])
            return
        }

        showRankInfo(player, ranks)
    }
}

/**
 * Show rank information to player
 * @param {Player} player - Player to show info to
 * @param {string[]} ranks - Array of rank tags
 */
function showRankInfo(player, ranks) {
    const rankPrefix = RankFormatter.formatPlayerRanks(player)
    const chatColor = RankFormatter.getPlayerChatColor(player)

    let message = `${rankPrefix}${chatColor}Your Ranks:\n`

    for (const rankTag of ranks) {
        const rankData = RankSystem.getRank(rankTag)
        if (!rankData) continue

        message += `\n§e${rankData.name} §7(${rankTag})`

        if (rankData.permissions) {
            message += "\n§7Permissions:"
            for (const [key, value] of Object.entries(rankData.permissions)) {
                if (typeof value === 'boolean' && value) {
                    message += `\n  §a✓ ${key}`
                } else if (typeof value === 'number') {
                    message += `\n  §f${key}: §b${value}`
                }
            }
        }
    }

    player.sendMessage(message)
}

/**
 * Get player's ranks sorted /* SINGULARITY */
 * @param {Player} player - Player to check
 * @returns {string[]} Array of rank tags
 */
function getPlayerRanks(player) {
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

