import { Configuration } from "../../Configuration.js"

/*
 * INDUSTRIAL_PEER_MIGRATION_HANDSHAKE
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for peer-to-peer relocation 
 * handshakes. Manages a volatile memory-buffer of pending migration 
 * requests and orchestrates their temporal expiration.
 *
 * PHILOSOPHY: Requests are transient synchronization-nodes. If a 
 * handshake is not completed within the defined industrial TTL, the node 
 * must be decommissioned.
 */

/** @type {Map<string, Object>} */
const pendingRequests = new Map() // VOLATILE_HANDSHAKE_REGISTRY

export const TpaHandshake = {
    /* 
     * HANDSHAKE_NODE_INJECTION
     * Injects a new migration-request node into the volatile registry.
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
     * HANDSHAKE_NODE_QUERY
     */
    getRequest(requestId) {
        return pendingRequests.get(requestId) || null
    },

    /* 
     * TARGET_IDENTIFIER_RESOLVER
     * Scans the volatile manifest for the latest handshake-node associated 
     * with the target entity.
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
     * HANDSHAKE_NODE_DECOMMISSION
     */
    removeRequest(requestId) {
        pendingRequests.delete(requestId)
    },

    /* 
     * REGISTRY_MAINTENANCE_PROTOCOL
     * Scans the volatile manifest and decommissions handshake-nodes that 
     * have exceeded the industrial TTL.
     */
    cleanup() {
        const now = Date.now()
        const expirationMs = (Configuration.TPA_EXPIRATION || 60) * 1000
        for (const [id, req] of pendingRequests.entries()) {
            if (now - req.timestamp > expirationMs) pendingRequests.delete(id)
        }
    }
}
