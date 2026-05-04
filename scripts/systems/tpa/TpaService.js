/**
 * TPA Service - Handle TPA logic with movement cancellation
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { system } from "@minecraft/server"
import { TPAStore } from "./TpaStore.js"
import { createRequest, acceptRequest, cleanup } from "./TpaHandshake.js"

/**
 * Send TPA request
 * @param {Player} sender - Sender player
 * @param {Player} target - Target player
 * @param {string} type - Request type
 * @returns {boolean} Success status
 */
export function sendRequest(sender, target, type) {
    if (!TPAStore.isEnabled(target.id)) {
        sender.sendMessage(`§c${target.name} has TPA disabled!`)
        return false
    }

    const requestId = createRequest(
        sender.id,
        sender.name,
        target.id,
        target.name,
        type
    )

    if (requestId) {
        sender.sendMessage(`§aTPA request sent to ${target.name}!`)

        // Default chat notification
        target.sendMessage(`§e[TPA] §b${sender.name} §7wants to teleport to you.`)
        target.sendMessage(`§7Type §a!tpaccept §7or §c!tpadeny §8(expires 60s)`)

        // Opt-in UI if enabled
        if (TPAStore.getUIToggle(target.id)) {
            system.run(async () => {
                try {
                    const { MessageFormData } = await import("@minecraft/server-ui")
                    const form = new MessageFormData()
                        .title("§6§lTPA Request")
                        .body(`§b${sender.name} §7wants to teleport to you.`)
                        .button2("§aAccept")
                        .button1("§cDeny")

                    const res = await form.show(target)
                    if (!res.canceled && res.selection === 1) {
                        // Execute accept logic
                        acceptRequest(target.id, sender.id)
                    }
                } catch (error) {
                    console.error(`TPA UI error: ${error}`)
                }
            })
        }
    }

    return !!requestId
}

/**
 * Handle TPA countdown with movement cancellation
 * @param {Player} player - Player to teleport
 * @param {Object} destination - Destination location
 * @param {string} type - Teleport type
 * @returns {boolean} Success status
 */
export async function executeTeleport(player, destination, type) {
    const startPos = { ...player.location }
    let countdown = 5

    // 5-second countdown with movement check
    for (let i = countdown; i > 0; i--) {
        player.onScreenDisplay.setActionBar(`§eTeleporting in §c${i}s...`)

        // Wait 1 second
        await new Promise(resolve => system.runTimeout(resolve, 1000))

        // Check movement
        if (hasMoved(player, startPos)) {
            player.sendMessage("§cTeleport cancelled! You moved!")
            return false
        }

        // Check combat
        if (isInCombat(player)) {
            player.sendMessage("§cTeleport cancelled! You're in combat!")
            return false
        }
    }

    // Execute teleport in system.run()
    system.run(() => {
        try {
            player.teleport(destination, {
                dimension: player.dimension,
                keepVelocity: false
            })
            player.sendMessage("§aTeleported!")
            return true
        } catch (error) {
            player.sendMessage("§cTeleport failed!")
            return false
        }
    })
}

/**
 * Check if player has moved significantly
 * @param {Player} player - Player to check
 * @param {Object} startPos - Starting position
 * @returns {boolean} Whether player moved
 */
function hasMoved(player, startPos) {
    const dx = Math.abs(player.location.x - startPos.x)
    const dy = Math.abs(player.location.y - startPos.y)
    const dz = Math.abs(player.location.z - startPos.z)
    return dx > 0.5 || dy > 0.5 || dz > 0.5
}

/**
 * Check if player is in combat
 * @param {Player} player - Player to check
 * @returns {boolean} Whether in combat
 */
function isInCombat(player) {
    // This would normally check combat system
    // For now, return false as placeholder
    return false
}

/**
 * Initialize TPA service
 */
export function init() {
    // Cleanup expired requests every 30 seconds
    system.runInterval(cleanup, 600)
    
    console.log("§2[Aethelgrad Essentials] TPA Service initialized")
}

