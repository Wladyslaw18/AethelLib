import { BroadcastStore } from "../../systems/broadcasts/BroadcastStore.js"
import { BroadcastService } from "../../systems/broadcasts/BroadcastService.js"

/*
 * BROADCAST_COMMAND
 * ----------------------------------------------------------------------------
 * Administrative interface for global message relay.
 */
export const BroadcastCommand = {
    name: "broadcast",
    description: "Manage automatic server broadcasts",

    usage: "/ae:broadcast <subcommand> [args...]",
    permission: "essentials.admin",
    category: "Admin",
    aliases: ["bc"],

    async execute(_data, player, args) {
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
                player.sendMessage(`§cERROR: Unknown subcommand: '${subcommand}'`);
                this.showHelp(player)
        }
    },

    async handleAdd(player, args) {
        const tier = args[0]?.toLowerCase()
        const message = args.slice(1).join(" ")

        if (!tier || !message) {
            player.sendMessage("§7Usage: /ae:bc add <tier> <content>");
            return
        }

        const success = BroadcastStore.addMessage(tier, message)
        if (success) {
            player.sendMessage(`§a§l» §fMessage added to §e${tier}§f tier.`);
        } else {
            player.sendMessage("§c§l» §7Invalid tier.");
        }

    },

    async handleRemove(player, args) {
        const tier = args[0]?.toLowerCase()
        const index = parseInt(args[1])

        if (!tier || isNaN(index)) {
            player.sendMessage("§7Usage: /ae:bc remove <tier> <index>");
            return
        }

        const success = BroadcastStore.removeMessage(tier, index)
        if (success) {
            player.sendMessage(`§a§l» §fMessage removed from §e${tier}§f tier.`);
        } else {
            player.sendMessage("§c§l» §7Invalid index.");
        }

    },

    async handleInterval(player, args) {
        const seconds = parseInt(args[0])

        if (isNaN(seconds) || seconds < 10) {
            player.sendMessage("§c§l» §7Minimum interval is 10s.");
            return
        }


        const success = BroadcastStore.setInterval(seconds)
        if (success) {
            player.sendMessage(`§a§l» §fBroadcast interval set to §e${seconds}s§f.`);
            if (BroadcastService.isRunning()) {
                BroadcastService.updateConfig(BroadcastStore.getConfig())
            }
        }

    },

    async handleTest(player, args) {
        const tier = args[0]?.toLowerCase() || "common"
        BroadcastService.testBroadcast(tier, player)
        player.sendMessage(`§a§l» §fSending §e${tier}§f test broadcast...`);

    },

    async handleStats(player) {
        const serviceStats = BroadcastService.getStats()
        const storeStats = BroadcastStore.getStats()

        player.sendMessage(" ")
        player.sendMessage("§6§lBroadcast Stats")
        player.sendMessage(`§7Status: ${serviceStats.running ? "§aRunning" : "§cStopped"}`)

        player.sendMessage(`§7Interval: §e${storeStats.interval}s`)
        player.sendMessage(`§7Next: §e${BroadcastService.getTimeUntilNext()}`)
        player.sendMessage(`§7Total: §e${serviceStats.totalBroadcasts}`)
    },

    async handleStart(player) {
        if (BroadcastService.isRunning()) return
        BroadcastService.init()
        player.sendMessage("§a§l» §fBroadcast system started.");

    },

    async handleStop(player) {
        if (!BroadcastService.isRunning()) return
        BroadcastService.stop()
        player.sendMessage("§6§l» §7Broadcast system stopped.");

    },

    async handleReload(player) {
        if (BroadcastService.isRunning()) BroadcastService.stop()
        BroadcastService.init()
        player.sendMessage("§a§l» §fBroadcast system reloaded.");

    },

    async handleList(player, args) {
        const tier = args[0]?.toLowerCase()
        if (tier) {
            const messages = BroadcastStore.getMessages(tier)
            player.sendMessage(" ")
            player.sendMessage(`§6§lBroadcast List: §e${tier.toUpperCase()}`)
            messages.forEach((m, i) => player.sendMessage(`§7[${i}] §f${m}`))
        } else {
            const stats = BroadcastStore.getStats()
            player.sendMessage(" ")
            player.sendMessage("§6§lBroadcast Summary")
            for (const [t, c] of Object.entries(stats.messagesByTier)) {
                player.sendMessage(`§7${t.toUpperCase()}: §e${c}`)
            }
        }

    },

    async handleClear(player, args) {
        const tier = args[0]?.toLowerCase()
        if (!tier) return
        BroadcastStore.clearTier(tier)
        player.sendMessage(`§a§l» §fBroadcast tier §e${tier}§f cleared.`);

    },

    showHelp(player) {
        player.sendMessage(" ")
        player.sendMessage("§6§lBroadcast Help")
        player.sendMessage("§7/ae:bc add <tier> <msg>")
        player.sendMessage("§7/ae:bc remove <tier> <idx>")
        player.sendMessage("§7/ae:bc interval <sec>")
        player.sendMessage("§7/ae:bc test [tier]")
        player.sendMessage("§7/ae:bc stats")
        player.sendMessage("§7/ae:bc on | off")
        player.sendMessage("§7/ae:bc reload")
        player.sendMessage("§7/ae:bc list [tier]")
        player.sendMessage(" ")
    }

}
