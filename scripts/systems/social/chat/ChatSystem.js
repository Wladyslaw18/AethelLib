import { Kernel } from "../../../core/Kernel.js"

/** @typedef {import("@minecraft/server").Player} Player */

let initialized = false
const chatCooldowns = new Map()

/**
 * Manages chat events, formatting, and mutes.
 */
export const ChatSystem = {
    /**
     * Initialize chat listeners
     */
    init: () => {
        if (initialized) return
        initialized = true

        // @ts-ignore
        Kernel.world.beforeEvents.chatSend.subscribe((ev) => {
            const player = ev.sender
            const message = ev.message
            
            // 🛡️ IGNORE COMMANDS IMMEDIATELY
            const SettingsStore = Kernel.get("settings")
            const customPrefix = SettingsStore?.get("commandPrefix") || "-"
            if (message.startsWith("/") || message.startsWith(customPrefix)) {
                return
            }
            
            const MuteStore = Kernel.get("muteStore")
            const PermissionManager = Kernel.get("permissions")
            const RankFormatter = Kernel.get("formatter")

            // Check if player is muted via the SUPREME_STORE
            if (MuteStore.isMuted(player)) {
                ev.cancel = true
                Kernel.system.run(() => {
                    const muteData = MuteStore.getMuteData(player)
                    if (muteData && muteData.duration > 0) {
                        const remaining = Math.ceil((muteData.duration - (Date.now() - muteData.startTime)) / 1000 / 60)
                        player.sendMessage(`\xA7cYou are muted. Remaining: \xA7e${remaining}m`)
                    } else {
                        player.sendMessage("\xA7cYou are permanently muted.")
                    }
                })
                return
            }

            // Check chat cooldown
            const cooldownTime = PermissionManager.hasPermission(player, "chat.cooldown") ? 0 : 2000 
            
            if (cooldownTime > 0) {
                const lastChat = chatCooldowns.get(player.id) || 0
                const now = Date.now()

                if (now - lastChat < cooldownTime) {
                    ev.cancel = true
                    const remaining = Math.ceil((cooldownTime - (now - lastChat)) / 1000)
                    player.sendMessage(`\xA7c\xA7l» \xA77Slow down! Wait \xA7e${remaining}s \xA77before chatting again.`)
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
     * Mute a player (Proxy to Store)
     */
    mutePlayer: (player, durationMs = 0) => {
        const MuteStore = Kernel.get("muteStore")
        return MuteStore.mute(player, durationMs)
    },

    /**
     * Unmute a player (Proxy to Store)
     */
    unmutePlayer: (player) => {
        const MuteStore = Kernel.get("muteStore")
        return MuteStore.unmute(player)
    },

    /**
     * Check if player is muted (Proxy to Store)
     */
    isMuted: (player) => {
        const MuteStore = Kernel.get("muteStore")
        return MuteStore.isMuted(player)
    }
}


