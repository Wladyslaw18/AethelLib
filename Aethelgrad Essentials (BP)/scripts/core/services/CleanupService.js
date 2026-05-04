/**
 * CleanupService - Prevents memory leaks by cleaning up player data on disconnect
 * Automatically removes player data from all tracking Maps and systems
 */

import { world, system } from "@minecraft/server"

export class CleanupService {
    constructor() {
        this.cleanupHandlers = new Map()
        this.initialize()
    }

    /**
     * Initialize the cleanup service
     */
    initialize() {
        // Subscribe to player leave events
        world.afterEvents.playerLeave.subscribe((event) => {
            this.handlePlayerLeave(event.playerId, event.playerName)
        })

        // Schedule periodic cleanup
        system.runInterval(() => {
            this.performPeriodicCleanup()
        }, 5 * 60 * 20) // Every 5 minutes
    }

    /**
     * Register a cleanup handler for a specific system
     * @param {string} systemName - Name of the system
     * @param {Function} cleanupFunction - Function to call for cleanup (playerId)
     */
    registerCleanupHandler(systemName, cleanupFunction) {
        this.cleanupHandlers.set(systemName, cleanupFunction)
    }

    /**
     * Unregister a cleanup handler
     * @param {string} systemName - Name of the system
     */
    unregisterCleanupHandler(systemName) {
        this.cleanupHandlers.delete(systemName)
    }

    /**
     * Handle player leave event
     * @param {string} playerId - Player ID
     * @param {string} playerName - Player name
     */
    handlePlayerLeave(playerId, playerName) {
        console.log(`Cleaning up data for player: ${playerName} (${playerId})`)

        // Run all registered cleanup handlers
        for (const [systemName, cleanupFunction] of this.cleanupHandlers) {
            try {
                cleanupFunction(playerId)
            } catch (error) {
                console.error(`Cleanup failed for ${systemName}: ${error}`)
            }
        }

        // Additional built-in cleanup operations
        this.cleanupPlayerData(playerId)
    }

    /**
     * Clean up player data from various systems
     * @param {string} playerId - Player ID
     */
    cleanupPlayerData(playerId) {
        // Clean up message history (if exists)
        if (global.messageHistory && global.messageHistory.has(playerId)) {
            global.messageHistory.delete(playerId)
        }

        // Clean up TPA requests (if exists)
        if (global.tpaRequests) {
            // Remove outgoing requests
            if (global.tpaRequests.outgoing && global.tpaRequests.outgoing.has(playerId)) {
                global.tpaRequests.outgoing.delete(playerId)
            }
            
            // Remove incoming requests
            if (global.tpaRequests.incoming && global.tpaRequests.incoming.has(playerId)) {
                global.tpaRequests.incoming.delete(playerId)
            }
        }

        // Clean up cooldowns (if exists)
        if (global.playerCooldowns && global.playerCooldowns.has(playerId)) {
            global.playerCooldowns.delete(playerId)
        }

        // Clean up any other global Maps that might store player data
        this.cleanupGlobalMaps(playerId)
    }

    /**
     * Clean up player data from global Maps
     * @param {string} playerId - Player ID
     */
    cleanupGlobalMaps(playerId) {
        // Get all global properties that are Maps
        for (const [key, value] of Object.entries(global)) {
            if (value instanceof Map && value.has(playerId)) {
                try {
                    value.delete(playerId)
                } catch (error) {
                    console.error(`Failed to clean up ${key} for player ${playerId}: ${error}`)
                }
            }
        }
    }

    /**
     * Perform periodic cleanup of stale data
     */
    performPeriodicCleanup() {
        const now = Date.now()
        let cleanedCount = 0

        // Clean up expired cooldowns
        if (global.playerCooldowns) {
            for (const [playerId, cooldowns] of global.playerCooldowns) {
                if (cooldowns instanceof Map) {
                    for (const [cooldownType, expiry] of cooldowns) {
                        if (expiry < now) {
                            cooldowns.delete(cooldownType)
                            cleanedCount++
                        }
                    }
                    
                    // Remove empty cooldown maps
                    if (cooldowns.size === 0) {
                        global.playerCooldowns.delete(playerId)
                    }
                }
            }
        }

        // Clean up expired TPA requests
        if (global.tpaRequests) {
            const TPA_TIMEOUT = 2 * 60 * 1000 // 2 minutes
            
            if (global.tpaRequests.outgoing) {
                for (const [playerId, request] of global.tpaRequests.outgoing) {
                    if (request.timestamp && (now - request.timestamp) > TPA_TIMEOUT) {
                        global.tpaRequests.outgoing.delete(playerId)
                        cleanedCount++
                    }
                }
            }

            if (global.tpaRequests.incoming) {
                for (const [playerId, request] of global.tpaRequests.incoming) {
                    if (request.timestamp && (now - request.timestamp) > TPA_TIMEOUT) {
                        global.tpaRequests.incoming.delete(playerId)
                        cleanedCount++
                    }
                }
            }
        }

        // Clean up old message history (keep only last 50 messages per player)
        if (global.messageHistory) {
            for (const [playerId, messages] of global.messageHistory) {
                if (Array.isArray(messages) && messages.length > 50) {
                    global.messageHistory.set(playerId, messages.slice(-50))
                    cleanedCount++
                }
            }
        }

        if (cleanedCount > 0) {
            console.log(`Periodic cleanup: removed ${cleanedCount} stale entries`)
        }
    }

    /**
     * Get cleanup statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const stats = {
            registeredHandlers: this.cleanupHandlers.size,
            globalMaps: 0,
            playerDataEntries: 0
        }

        // Count global Maps and their entries
        for (const [key, value] of Object.entries(global)) {
            if (value instanceof Map) {
                stats.globalMaps++
                stats.playerDataEntries += value.size
            }
        }

        return stats
    }

    /**
     * Force cleanup for all players (useful for testing)
     */
    forceCleanupAll() {
        const onlinePlayerIds = world.getPlayers().map(p => p.id)
        
        // Clean up data for offline players
        for (const [key, value] of Object.entries(global)) {
            if (value instanceof Map) {
                for (const playerId of value.keys()) {
                    if (!onlinePlayerIds.includes(playerId)) {
                        value.delete(playerId)
                    }
                }
            }
        }

        console.log("Forced cleanup completed for all offline players")
    }
}

// Singleton instance
export const CleanupServiceInstance = new CleanupService()
