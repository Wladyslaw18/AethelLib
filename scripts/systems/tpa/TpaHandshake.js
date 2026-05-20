import { Configuration } from "../../Configuration.js"

/*
 * TPA Handshake
 * ----------------------------------------------------------------------------
 * Handles pending teleport requests and their expiration.
 */

/** @type {Map<string, Object>} */
const pendingRequests = new Map() // Pending TPA requests
const targetToLatest = new Map()
const senderToLatest = new Map()

export const TpaHandshake = {
    /* 
     * Create a new TPA request
     */
    createRequest(senderId, senderName, targetId, targetName, type) {
        const requestId = `${senderId}:${targetId}:${type}`
        const request = {
            id: requestId,
            senderId,
            senderName,
            targetId,
            targetName,
            type, // "tpa" | "tpahere"
            timestamp: Date.now()
        }
        pendingRequests.set(requestId, request)
        targetToLatest.set(targetId, request)
        senderToLatest.set(senderId, request)
        return requestId
    },

    /* 
     * Get a TPA request by ID
     */
    getRequest(requestId) {
        return pendingRequests.get(requestId) || null
    },

    /* 
     * Get the latest request for a target player
     */
    getLatestRequestFor(targetId) {
        return targetToLatest.get(targetId) || null
    },

    /* 
     * Get the latest request from a sender
     */
    getLatestRequestFrom(senderId) {
        return senderToLatest.get(senderId) || null
    },

    /* 
     * Remove a request
     */
    removeRequest(requestId) {
        const req = pendingRequests.get(requestId)
        if (req) {
            if (targetToLatest.get(req.targetId)?.id === requestId) targetToLatest.delete(req.targetId)
            if (senderToLatest.get(req.senderId)?.id === requestId) senderToLatest.delete(req.senderId)
            pendingRequests.delete(requestId)
        }
    },

    /* 
     * Cleanup expired requests
     */
    cleanup() {
        const now = Date.now()
        const expirationMs = (Configuration.TPA_EXPIRATION || 60) * 1000
        for (const [id, req] of pendingRequests.entries()) {
            if (now - req.timestamp > expirationMs) {
                this.removeRequest(id)
            }
        }
    },

    /* 
     * Cleanup player TPA handshake references when they leave
     */
    handlePlayerLeave(playerId) {
        for (const [id, req] of pendingRequests.entries()) {
            if (req.senderId === playerId || req.targetId === playerId) {
                this.removeRequest(id)
            }
        }
        targetToLatest.delete(playerId)
        senderToLatest.delete(playerId)
    }
}

