/**
 * Claim UI — View and manage land claims
 */

import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { PERMISSIONS } from "../../systems/protection/ClaimService.js"

/**
 * Show claim management UI
 * @param {import("@minecraft/server").Player} player
 */
export async function showClaimUI(player) {
    const ClaimStore = Kernel.get("claimStore")
    const claims = ClaimStore.getPlayerClaims(player.id)

    const form = new ActionFormData()
        .title("§b§l🛡️ Your Claims")
        .body(claims.length > 0
            ? `§7You have §e${claims.length}§7 claim(s)\n§7Stand in a chunk and use §e!claim§7 to claim it.`
            : "§7You have no claims.\n§7Stand in a chunk and use §e!claim§7 to claim it.")

    // Back button
    form.button("§c← Back")

    // Claim buttons
    for (const claim of claims) {
        form.button(`§b${claim.chunkKey}\n§7Trusted: ${Object.keys(claim.data?.trusted || {}).length}`)
    }

    const response = await form.show(player)
    if (response.canceled) return

    if (response.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        await showMainGUI(player)
        return
    }

    // Show claim info
    const selectedClaim = claims[response.selection - 1]
    if (selectedClaim) {
        player.sendMessage(`§bClaim: §f${selectedClaim.chunkKey}`)
        player.sendMessage(`§7Trusted players: §f${Object.keys(selectedClaim.data?.trusted || {}).length}`)
    }
}
