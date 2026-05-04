import { Kernel } from "../../../core/Kernel.js"

/** @typedef {import("@minecraft/server").Player} Player */

let initialized = false
const chatCooldowns = new Map()

export const ChatSystem = {
    /**
     * Initialize chat system
     */
    init: () => {
        if (initialized) return
        initialized = true

        Kernel.world.beforeEvents.chatSend.subscribe((ev) => {
            const player = ev.sender
            const message = ev.message
            
            const MuteStore = Kernel.get("muteStore")
            const PermissionManager = Kernel.get("permissions")
            const RankFormatter = Kernel.get("formatter")

            // Check if player is muted
            if (MuteStore.isMuted(player)) {
                ev.cancel = true
                Kernel.system.run(() => {
                    player.sendMessage("§cYou are currently muted and cannot speak.")
                })
                return
            }

            // Check chat cooldown
            const cooldownTime = PermissionManager.hasPermission(player, "chat.cooldown") ? 0 : 2000 // Example logic
            // Note: Original code used PermissionManager.get(player, "chat.cooldown")
            // We should stick to the new PermissionManager instance methods
            
            if (cooldownTime > 0) {
                const lastChat = chatCooldowns.get(player.id) || 0
                const now = Date.now()

                if (now - lastChat < cooldownTime) {
                    ev.cancel = true
                    const remaining = Math.ceil((cooldownTime - (now - lastChat)) / 1000)
                    player.sendMessage(`§cPlease wait ${remaining} seconds before chatting again.`)
                    return
                }

                chatCooldowns.set(player.id, now)
            }

            // Format chat with ranks
            const formattedMessage = RankFormatter.formatChatMessage(player, message)

            // Cancel original and send formatted
            ev.cancel = true

            // Use system.run to avoid issues with event cancellation
            Kernel.system.run(() => {
                for (const p of Kernel.world.getAllPlayers()) {
                    p.sendMessage(formattedMessage)
                }
            })
        })
    },

    /**
     * Mute a player
     * @param {Player} player - Player to mute
     * @param {number} durationMs - Duration in milliseconds (0 = permanent)
     */
    mutePlayer: (player, durationMs = 0) => {
        const muteData = {
            muted: true,
            startTime: Date.now(),
            duration: durationMs
        }

        player.setDynamicProperty("ae:mute", JSON.stringify(muteData))
    },

    /**
     * Unmute a player
     * @param {Player} player - Player to unmute
     */
    unmutePlayer: (player) => {
        player.setDynamicProperty("ae:mute", undefined)
    },

    /**
     * Check if player is muted
     * @param {Player} player - Player to check
     * @returns {boolean} Whether player is muted
     */
    isMuted: (player) => {
        return isPlayerMuted(player)
    }
}

/**
 * Check if player is muted (internal function)
 * @param {Player} player - Player to check
 * @returns {boolean} Whether player is muted
 */
function isPlayerMuted(player) {
    try {
        const muteData = player.getDynamicProperty("ae:mute")
        if (!muteData) return false

        const mute = JSON.parse(String(muteData))
        if (!mute.muted) return false

        // Check if mute has expired
        if (mute.duration > 0) {
            const elapsed = Date.now() - mute.startTime
            if (elapsed >= mute.duration) {
                // Mute expired, remove it
                player.setDynamicProperty("ae:mute", undefined)
                return false
            }
        }

        return true
    } catch {
        return false
    }
}
