/**
 * Broadcast Command - Admin control for broadcast system
 * Sub-commands: add, remove, interval, test, stats, start, stop, reload
 */

import { BroadcastStore } from "../../systems/broadcasts/BroadcastStore.js"
import { BroadcastService } from "../../systems/broadcasts/BroadcastService.js"

export const BroadcastCommand = {
    name: "broadcast",
    description: "Manage broadcast system messages and settings",
    usage: "!broadcast <subcommand> [args...]",
    permission: "essentials.admin",
    category: "admin",
    aliases: ["ae:bc"],

    async execute(data, player, args) {
        const subcommand = args[0]?.toLowerCase()

        if (!subcommand) {
            this.showHelp(player)
            return
        }

        switch (subcommand) {
            case "add":
                await this.handleAdd(player, args.slice(1))
                break
            case "remove":
                await this.handleRemove(player, args.slice(1))
                break
            case "interval":
                await this.handleInterval(player, args.slice(1))
                break
            case "test":
                await this.handleTest(player, args.slice(1))
                break
            case "stats":
                await this.handleStats(player)
                break
            case "start":
            case "on":
                await this.handleStart(player)
                break
            case "stop":
            case "off":
                await this.handleStop(player)
                break
            case "reload":
                await this.handleReload(player)
                break
            case "list":
                await this.handleList(player, args.slice(1))
                break
            case "clear":
                await this.handleClear(player, args.slice(1))
                break
            default:
                player.sendMessage(`§cUnknown subcommand: §e${subcommand}`)
                this.showHelp(player)
        }
    },

    /**
     * Handle add subcommand
     */
    async handleAdd(player, args) {
        const tier = args[0]?.toLowerCase()
        const message = args.slice(1).join(" ")

        if (!tier || !message) {
            player.sendMessage("§cUsage: !broadcast add <tier> <message>")
            player.sendMessage("§7Tiers: common, uncommon, rare, legendary")
            return
        }

        const success = BroadcastStore.addMessage(tier, message)
        if (success) {
            player.sendMessage(`§aAdded message to §e${tier} §atier`)
        } else {
            player.sendMessage(`§cFailed to add message. Invalid tier or message.`)
        }
    },

    /**
     * Handle remove subcommand
     */
    async handleRemove(player, args) {
        const tier = args[0]?.toLowerCase()
        const index = parseInt(args[1])

        if (!tier || isNaN(index)) {
            player.sendMessage("§cUsage: !broadcast remove <tier> <index>")
            return
        }

        const success = BroadcastStore.removeMessage(tier, index)
        if (success) {
            player.sendMessage(`§aRemoved message §e${index} §afrom §e${tier} §atier`)
        } else {
            player.sendMessage(`§cFailed to remove message. Invalid tier or index.`)
        }
    },

    /**
     * Handle interval subcommand
     */
    async handleInterval(player, args) {
        const seconds = parseInt(args[0])

        if (isNaN(seconds) || seconds < 10) {
            player.sendMessage("§cUsage: !broadcast interval <seconds> (minimum: 10)")
            return
        }

        const success = BroadcastStore.setInterval(seconds)
        if (success) {
            player.sendMessage(`§aBroadcast interval set to §e${seconds} §aseconds`)
            // Reschedule if service is running
            if (BroadcastService.isRunning()) {
                BroadcastService.updateConfig(BroadcastStore.getConfig())
            }
        } else {
            player.sendMessage(`§cFailed to set interval.`)
        }
    },

    /**
     * Handle test subcommand
     */
    async handleTest(player, args) {
        const tier = args[0]?.toLowerCase() || "common"

        if (!["common", "uncommon", "rare", "legendary"].includes(tier)) {
            player.sendMessage("§cInvalid tier. Use: common, uncommon, rare, legendary")
            return
        }

        BroadcastService.testBroadcast(tier, player)
        player.sendMessage(`§aTested §e${tier} §amessage`)
    },

    /**
     * Handle stats subcommand
     */
    async handleStats(player) {
        const serviceStats = BroadcastService.getStats()
        const storeStats = BroadcastStore.getStats()

        player.sendMessage("§6§lBroadcast Statistics")
        player.sendMessage(`§7Status: ${serviceStats.running ? "§aRunning" : "§cStopped"}`)
        player.sendMessage(`§7Interval: §e${storeStats.interval} §7seconds`)
        player.sendMessage(`§7Next broadcast: §e${BroadcastService.getTimeUntilNext()}`)
        player.sendMessage(`§7Total broadcasts: §e${serviceStats.totalBroadcasts}`)
        player.sendMessage(`§7Messages /* SINGULARITY */:`)

        for (const [tier, count] of Object.entries(storeStats.messagesByTier)) {
            player.sendMessage(`  §7${tier}: §e${count}`)
        }
    },

    /**
     * Handle start subcommand
     */
    async handleStart(player) {
        if (BroadcastService.isRunning()) {
            player.sendMessage("§7Broadcast service is already running")
            return
        }

        BroadcastService.init()
        player.sendMessage("§aBroadcast service started")
    },

    /**
     * Handle stop subcommand
     */
    async handleStop(player) {
        if (!BroadcastService.isRunning()) {
            player.sendMessage("§7Broadcast service is already stopped")
            return
        }

        BroadcastService.stop()
        player.sendMessage("§cBroadcast service stopped")
    },

    /**
     * Handle reload subcommand
     */
    async handleReload(player) {
        const wasRunning = BroadcastService.isRunning()

        if (wasRunning) {
            BroadcastService.stop()
        }

        BroadcastService.init()
        player.sendMessage(`§aBroadcast service reloaded ${wasRunning ? "(was running)" : "(was stopped)"}`)
    },

    /**
     * Handle list subcommand
     */
    async handleList(player, args) {
        const tier = args[0]?.toLowerCase()

        if (tier) {
            // List specific tier
            if (!["common", "uncommon", "rare", "legendary"].includes(tier)) {
                player.sendMessage("§cInvalid tier. Use: common, uncommon, rare, legendary")
                return
            }

            const messages = BroadcastStore.getMessages(tier)
            player.sendMessage(`§6§l${tier.charAt(0).toUpperCase() + tier.slice(1)} Messages (${messages.length})`)

            messages.forEach((message, index) => {
                player.sendMessage(`§7[${index}] §f${message}`)
            })
        } else {
            // List all tiers summary
            const allMessages = BroadcastStore.getAllMessages()
            player.sendMessage("§6§lBroadcast Messages Summary")

            for (const [tier, messages] of Object.entries(allMessages)) {
                player.sendMessage(`§7${tier}: §e${messages.length} §7messages`)
            }
        }
    },

    /**
     * Handle clear subcommand
     */
    async handleClear(player, args) {
        const tier = args[0]?.toLowerCase()

        if (!tier) {
            player.sendMessage("§cUsage: !broadcast clear <tier>")
            player.sendMessage("§7Tiers: common, uncommon, rare, legendary")
            return
        }

        if (!["common", "uncommon", "rare", "legendary"].includes(tier)) {
            player.sendMessage("§cInvalid tier. Use: common, uncommon, rare, legendary")
            return
        }

        const success = BroadcastStore.clearTier(tier)
        if (success) {
            player.sendMessage(`§aCleared all messages from §e${tier} §atier`)
        } else {
            player.sendMessage(`§cFailed to clear tier.`)
        }
    },

    /**
     * Show help information
     */
    showHelp(player) {
        player.sendMessage("§6§lBroadcast Command Help")
        player.sendMessage("§7Subcommands:")
        player.sendMessage("  §eadd <tier> <message> §7- Add message to tier")
        player.sendMessage("  §eremove <tier> <index> §7- Remove message from tier")
        player.sendMessage("  §einterval <seconds> §7- Set broadcast interval")
        player.sendMessage("  §etest [tier] §7- Test broadcast message")
        player.sendMessage("  §estats §7- Show broadcast statistics")
        player.sendMessage("  §eon/start §7- Start broadcast service")
        player.sendMessage("  §eoff/stop §7- Stop broadcast service")
        player.sendMessage("  §ereload §7- Reload broadcast service")
        player.sendMessage("  §elist [tier] §7- List messages")
        player.sendMessage("  §eclear <tier> §7- Clear all messages from tier")
        player.sendMessage("§7Tiers: common, uncommon, rare, legendary")
        player.sendMessage("§7Aliases: !ae:bc (same as !broadcast)")
    }
}

