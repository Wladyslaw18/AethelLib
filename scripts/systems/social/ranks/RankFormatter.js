import { Kernel } from "../../../core/Kernel.js"
import { ColorSystem } from "../../social/chat/ColorSystem.js"

/*
 * INDUSTRIAL_HIERARCHY_FORMATTER
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the visual manifestation of 
 * entity status-nodes within the communication-buffer. Performs O(1) 
 * resolution of the highest-clearance rank and maps it to the target 
 * color-protocol.
 *
 * PHILOSOPHY: Status must be visible. Use this formatter to manifest the 
 * entity's clearance-level and ensure communication-parity across the 
 * industrial network.
 */
export const RankFormatter = {
    /* 
     * HIERARCHY_PREFIX_MANIFEST
     * Resolves the highest-clearance node and constructs the visual 
     * prefix-buffer.
     */
    formatPlayerRanks: (player) => {
        const PermissionManager = Kernel.get("permissions")
        const highestRank = PermissionManager.getHighestRank(player)
        if (!highestRank || !highestRank.name || highestRank.hideRanks) return ""
        return `\u00A77[${highestRank.name.toUpperCase()}] \u00A7r`
    },
 
    /* 
     * COMMUNICATION_COLOR_RESOLVER
     */
    getPlayerChatColor: (player) => {
        return ColorSystem.getPlayerColor(player)
    },

    /* 
     * PACKET_FORMAT_ORCHESTRATOR
     * Merges the hierarchy-prefix, entity-identifier, and communication-payload 
     * into a single industrial-grade manifest.
     */
    formatChatMessage: (player, message) => {
        const rankPrefix = RankFormatter.formatPlayerRanks(player)
        const chatColor = RankFormatter.getPlayerChatColor(player)
        const sanitizedMessage = message.replace(/\n/g, "")
        return `${rankPrefix}${chatColor}${player.name}\u00A7r: \u00A7f${sanitizedMessage}`
    }
}
