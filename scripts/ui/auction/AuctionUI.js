/**
 * Auction UI — Entry point for the auction system
 */

import { ActionFormData } from "@minecraft/server-ui"

/**
 * Show auction UI
 * @param {import("@minecraft/server").Player} player
 */
export async function showAuctionUI(player) {
    const form = new ActionFormData()
        .title("§d§l⚖️ Auction House")
        .body("§7The auction house is coming soon!\n§7Use §e!auction§7 commands in the meantime.")
        .button("§c← Back")

    const response = await form.show(player)
    if (response.canceled) return

    if (response.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        await showMainGUI(player)
    }
}
