/**
 * Claim UI — View and manage land claims
 */

import { Kernel } from "../../core/Kernel.js"
import { UIUtils } from "../UIUtils.js"
// import { PERMISSIONS } from "../../systems/protection/ClaimService.js"

/**
 * Show claim management UI
 * @param {import("@minecraft/server").Player} player
 */
export async function showClaimUI(player) {
    const ClaimStore = Kernel.get("claimStore")
    const claims = ClaimStore.getPlayerClaims(player.id)

    const form = new Kernel.ActionFormData()
        .title("\xA7b\xA7l🛡️ Your Claims")
        .body(claims.length > 0
            ? `\xA77You have \xA7e${claims.length}\xA77 claim(s)\n\xA77Stand in a chunk and use \xA7e!claim\xA77 to claim it.`
            : "\xA77You have no claims.\n\xA77Stand in a chunk and use \xA7e!claim\xA77 to claim it.")

    // Back button
    form.button("\xA7c← Back")

    // Claim buttons
    for (const claim of claims) {
        form.button(`\xA7b${claim.chunkKey}\n\xA77Trusted: ${Object.keys(claim.data?.trusted || {}).length}`)
    }

    const response = await UIUtils.showForm(player, form)
    if (response.canceled) return

    if (response.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        await showMainGUI(player)
        return
    }

    // Show claim info
    const selectedClaim = claims[response.selection - 1]
    if (selectedClaim) {
        player.sendMessage(`\xA7bClaim: \xA7f${selectedClaim.chunkKey}`)
        player.sendMessage(`\xA77Trusted players: \xA7f${Object.keys(selectedClaim.data?.trusted || {}).length}`)
    }
}
