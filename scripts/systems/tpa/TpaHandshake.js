import { Configuration } from "../../Configuration.js"

/*
 * TPA Handshake
 * ----------------------------------------------------------------------------
 * Handles pending teleport requests and their expiration.
 */

/** @type {Map<string, Object>} */
const pendingRequests = new Map() // Pending TPA requests

export const TpaHandshake = {
    /* 
     * Create a new TPA request
     */
    createRequest(senderId, senderName, targetId, targetName, type) {
        const requestId = `${senderId}:${targetId}`
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
        let latest = null
        for (const req of pendingRequests.values()) {
            if (req.targetId === targetId) {
                if (!latest || req.timestamp > latest.timestamp) latest = req
            }
        }
        return latest
    },

    /* 
     * Get the latest request from a sender
     */
    getLatestRequestFrom(senderId) {
        let latest = null
        for (const req of pendingRequests.values()) {
            if (req.senderId === senderId) {
                if (!latest || req.timestamp > latest.timestamp) latest = req
            }
        }
        return latest
    },

    /* 
     * Remove a request
     */
    removeRequest(requestId) {
        pendingRequests.delete(requestId)
    },

    /* 
     * Cleanup expired requests
     */
    cleanup() {
        const now = Date.now()
        const expirationMs = (Configuration.TPA_EXPIRATION || 60) * 1000
        for (const [id, req] of pendingRequests.entries()) {
            if (now - req.timestamp > expirationMs) pendingRequests.delete(id)
        }
    }
}

