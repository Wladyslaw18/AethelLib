import { Kernel } from "../../core/Kernel.js"

/** @typedef {import("@minecraft/server").Player} Player */

let initialized = false

export const BanManager = {
    /**
     * Initialize ban manager
     */
    init: () => {
        if (initialized) return
        initialized = true

        // Check for expired temp bans every minute
        Kernel.system.runInterval(cleanupExpiredBans, 60 * 20)

        // Check player spawn for active bans
        Kernel.world.afterEvents.playerSpawn.subscribe((event) => {
            const player = event.player
            checkPlayerBan(player)
        })

        console.log("§2[AethelLib] Ban manager initialized and docked")
    }
}

function cleanupExpiredBans() {
    try {
        const WorldStore = Kernel.get("worldStore")
        const bans = getBans()
        const now = Date.now()
        
        // Filter out expired temp bans
        const activeBans = bans.filter(ban => {
            if (ban.temp && ban.expires <= now) {
                console.log(`§7[Aethelgrad] Temp ban expired for ${ban.playerName}`)
                return false
            }
            return true
        })

        // Update bans if any expired
        if (activeBans.length !== bans.length) {
            WorldStore.set("ae:bans", activeBans)
        }
    } catch (error) {
        console.error(`Failed to cleanup expired bans: ${error}`)
    }
}

function checkPlayerBan(player) {
    try {
        const bans = getBans()
        const now = Date.now()
        
        // Check if player has an active ban
        const activeBan = bans.find(ban => 
            ban.playerId === player.id && 
            (ban.expires === 0 || ban.expires > now)
        )
        
        if (activeBan) {
            // Kick player with ban message
            const durationText = activeBan.temp ? 
                `Duration: ${formatTimeRemaining(activeBan.expires - now)}` : 
                "Permanent"
                
            Kernel.system.run(() => {
                player.kick(`§cYou are banned from this server.\n§eReason: ${activeBan.reason}\n§7${durationText}`)
            })
        }
    } catch (error) {
        console.error(`Failed to check player ban: ${error}`)
    }
}

function getBans() {
    try {
        const WorldStore = Kernel.get("worldStore")
        const stored = WorldStore.get("ae:bans")
        return stored || []
    } catch (error) {
        console.error(`Failed to load bans: ${error}`)
        return []
    }
}

function formatTimeRemaining(milliseconds) {
    if (milliseconds <= 0) return "Expired"

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}
