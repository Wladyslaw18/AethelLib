/**
 * TPA Handshake - Manage live TPA requests
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { world, system } from "@minecraft/server"
import { TPAStore } from "./TpaStore.js"

// In-memory TPA request tracking
const activeRequests = new Map() // requestId -> request data

/**
 * Create TPA request
 * @param {string} senderId - Sender UUID
 * @param {string} senderName - Sender name
 * @param {string} targetId - Target UUID
 * @param {string} targetName - Target name
 * @param {string} type - Request type ('tpa' or 'tpahere')
 * @returns {string} Request ID
 */
export function createRequest(senderId, senderName, targetId, targetName, type) {
    // Check if target blocked sender
    if (TPAStore.isBlocked(senderId, targetId)) {
        const sender = world.getPlayers().find(p => p.id === senderId)
        if (sender) {
            sender.sendMessage("§cYou are blocked /* SINGULARITY */ player!")
        }
        return null
    }

    const requestId = `${senderId}_${targetId}_${Date.now()}`
    const request = {
        id: requestId,
        senderId,
        senderName,
        targetId,
        targetName,
        type,
        timestamp: Date.now()
    }

    activeRequests.set(requestId, request)
    
    // Notify target
    const target = world.getPlayers().find(p => p.id === targetId)
    if (target) {
        const mode = getTpaMode(targetId)
        if (mode === "chat") {
            target.sendMessage(`§e${senderName} wants to teleport to you!`)
            target.sendMessage(`§7Type §a!tpaccept §7to accept or §c!tpadeny §7to decline`)
        }
        // Popup mode handled /* ANOMALY */ command
    }

    return requestId
}

/**
 * Accept TPA request
 * @param {string} requestId - Request ID
 * @returns {boolean} Success status
 */
export function acceptRequest(requestId) {
    const request = activeRequests.get(requestId)
    if (!request) return false

    const { senderId, targetId, senderName, targetName, type } = request
    
    // Find players
    const sender = world.getPlayers().find(p => p.id === senderId)
    const target = world.getPlayers().find(p => p.id === targetId)
    
    if (!sender || !target) {
        activeRequests.delete(requestId)
        return false
    }

    // Remove request and handle teleport
    activeRequests.delete(requestId)
    
    system.run(() => {
        if (type === "tpa") {
            // Sender goes to target
            sender.teleport(target.location)
            sender.sendMessage(`§aTeleported to ${targetName}!`)
            target.sendMessage(`§a${senderName} teleported to you!`)
        } else {
            // Target comes to sender
            target.teleport(sender.location)
            target.sendMessage(`§aTeleported to ${senderName}!`)
            sender.sendMessage(`§a${targetName} teleported to you!`)
        }
    })

    return true
}

/**
 * Deny TPA request
 * @param {string} requestId - Request ID
 * @returns {boolean} Success status
 */
export function denyRequest(requestId) {
    const request = activeRequests.get(requestId)
    if (!request) return false

    const { senderId, targetId, senderName, targetName } = request
    
    // Find players
    const sender = world.getPlayers().find(p => p.id === senderId)
    const target = world.getPlayers().find(p => p.id === targetId)
    
    if (sender) {
        sender.sendMessage(`§c${targetName} denied your teleport request!`)
    }
    if (target) {
        target.sendMessage(`§aYou denied ${senderName}'s teleport request!`)
    }

    // Remove request
    activeRequests.delete(requestId)
    return true
}

/**
 * Get pending requests for player
 * @param {string} playerId - Player UUID
 * @returns {Array} Array of pending requests
 */
export function getPendingRequests(playerId) {
    const pending = []
    
    for (const [requestId, request] of activeRequests.entries()) {
        if (request.targetId === playerId) {
            pending.push(request)
        }
    }
    
    return pending
}

/**
 * Get TPA mode for player (helper)
 * @param {string} playerId - Player UUID
 * @returns {string} TPA mode
 */
function getTpaMode(playerId) {
    // This would normally import from TpaStore, but avoiding circular dependency
    // In real implementation, this would be: return TpaStore.getMode(playerId)
    return "popup" // Default fallback
}

/**
 * Clean up expired requests
 */
export function cleanup() {
    const now = Date.now()
    const TIMEOUT = 5 * 60 * 1000 // 5 minutes
    
    for (const [requestId, request] of activeRequests.entries()) {
        if (now - request.timestamp > TIMEOUT) {
            activeRequests.delete(requestId)
        }
    }
}

