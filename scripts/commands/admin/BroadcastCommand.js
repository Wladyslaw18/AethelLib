import { BroadcastStore } from "../../systems/broadcasts/BroadcastStore.js"
import { BroadcastService } from "../../systems/broadcasts/BroadcastService.js"

/*
 * GLOBAL_BROADCAST_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * The administrative interface for managing the system-wide message relay. 
 * Orchestrates sub-system configurations (Tiers, Intervals) and manages 
 * the operational lifecycle (Start/Stop/Reload) of the BroadcastService.
 *
 * PHILOSOPHY: Information is a resource. Control the relay, control the flow.
 */
export const BroadcastCommand = {
    name: "broadcast",
    description: "Orchestrates the global administrative message-relay system.",
    usage: "!broadcast <subcommand> [args...]",
    permission: "essentials.admin",
    category: "Admin",
    aliases: ["ae:bc"],

    /* 
     * SUBCOMMAND_ROUTING_ENGINE
     */
    async execute(player, args) {
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
                player.sendMessage(`[Error] Unknown broadcast vector: '${subcommand}'`);
                this.showHelp(player)
        }
    },

    /*
     * MESSAGE_INJECTION_HANDLER
     */
    async handleAdd(player, args) {
        const tier = args[0]?.toLowerCase()
        const message = args.slice(1).join(" ")

        if (!tier || !message) {
            player.sendMessage("[Manual] Syntax Hint: !broadcast add <tier> <content>");
            player.sendMessage("[Manual] Valid Tiers: common, uncommon, rare, legendary");
            return
        }

        const success = BroadcastStore.addMessage(tier, message)
        if (success) {
            player.sendMessage(`[Success] Content injected into ${tier.toUpperCase()} tier.`);
        } else {
            player.sendMessage("[Error] Injection failure: Invalid tier or malformed content.");
        }
    },

    /*
     * MESSAGE_DECOMMISSION_HANDLER
     */
    async handleRemove(player, args) {
        const tier = args[0]?.toLowerCase()
        const index = parseInt(args[1])

        if (!tier || isNaN(index)) {
            player.sendMessage("[Manual] Syntax Hint: !broadcast remove <tier> <index>");
            return
        }

        const success = BroadcastStore.removeMessage(tier, index)
        if (success) {
            player.sendMessage(`[Success] Content decommissioned from ${tier.toUpperCase()} tier.`);
        } else {
            player.sendMessage("[Error] Decommission failure: Invalid tier or index OOB.");
        }
    },

    /*
     * INTERVAL_CALIBRATION_HANDLER
     */
    async handleInterval(player, args) {
        const seconds = parseInt(args[0])

        if (isNaN(seconds) || seconds < 10) {
            player.sendMessage("[Error] Calibration failure: Interval must be >= 10s.");
            return
        }

        const success = BroadcastStore.setInterval(seconds)
        if (success) {
            player.sendMessage(`[Success] Relay interval calibrated to ${seconds}s.`);
            if (BroadcastService.isRunning()) {
                BroadcastService.updateConfig(BroadcastStore.getConfig())
            }
        } else {
            player.sendMessage("[Fatal] Configuration commit failure.");
        }
    },

    /*
     * DIAGNOSTIC_TEST_HANDLER
     */
    async handleTest(player, args) {
        const tier = args[0]?.toLowerCase() || "common"

        if (!["common", "uncommon", "rare", "legendary"].includes(tier)) {
            player.sendMessage("[Error] Test failure: Unsupported tier.");
            return
        }

        BroadcastService.testBroadcast(tier, player)
        player.sendMessage(`[Success] Dispatching diagnostic packet (${tier.toUpperCase()}).`);
    },

    /*
     * ANALYTICS_DIAGNOSTIC_HANDLER
     */
    async handleStats(player) {
        const serviceStats = BroadcastService.getStats()
        const storeStats = BroadcastStore.getStats()

        player.sendMessage("§0§l» §6§lBROADCAST_METRICS§0 «")
        player.sendMessage(`§7Operational_Status: ${serviceStats.running ? "§aRUNNING" : "§cSTANDBY"}`)
        player.sendMessage(`§7Relay_Interval: §e${storeStats.interval}s`)
        player.sendMessage(`§7Next_Dispatch_TTL: §e${BroadcastService.getTimeUntilNext()}`)
        player.sendMessage(`§7Total_Packets_Relayed: §e${serviceStats.totalBroadcasts}`)
        player.sendMessage(`§7Message_Density:`)

        for (const [tier, count] of Object.entries(storeStats.messagesByTier)) {
            player.sendMessage(`  §7${tier.toUpperCase()}: §e${count} entries`)
        }
    },

    /*
     * LIFECYCLE_START_HANDLER
     */
    async handleStart(player) {
        if (BroadcastService.isRunning()) {
            player.sendMessage("[Info] Service already operational.");
            return
        }

        BroadcastService.init()
        player.sendMessage("[Success] Broadcast service activated.");
    },

    /*
     * LIFECYCLE_STOP_HANDLER
     */
    async handleStop(player) {
        if (!BroadcastService.isRunning()) {
            player.sendMessage("[Info] Service already in standby.");
            return
        }

        BroadcastService.stop()
        player.sendMessage("[Warning] Broadcast service deactivated.");
    },

    /*
     * SERVICE_REBOOT_HANDLER
     */
    async handleReload(player) {
        const wasRunning = BroadcastService.isRunning()
        if (wasRunning) BroadcastService.stop()

        BroadcastService.init()
        player.sendMessage(`[Success] Broadcast service reloaded. (Prev_State: ${wasRunning ? "ACTIVE" : "STANDBY"})`);
    },

    /*
     * CONTENT_MANIFEST_HANDLER
     */
    async handleList(player, args) {
        const tier = args[0]?.toLowerCase()

        if (tier) {
            if (!["common", "uncommon", "rare", "legendary"].includes(tier)) {
                player.sendMessage("[Error] Query failure: Unsupported tier.");
                return
            }

            const messages = BroadcastStore.getMessages(tier)
            player.sendMessage(`§0§l» §6§lMANIFEST: ${tier.toUpperCase()}§0 «`)

            messages.forEach((message, index) => {
                player.sendMessage(`§7[${index}] §f${message}`)
            })
        } else {
            const allMessages = BroadcastStore.getAllMessages()
            player.sendMessage("§0§l» §6§lGLOBAL_BROADCAST_SUMMARY§0 «")

            for (const [tier, messages] of Object.entries(allMessages)) {
                player.sendMessage(`§7${tier.toUpperCase()}: §e${messages.length} entries`)
            }
        }
    },

    /*
     * TIER_PURGE_HANDLER
     */
    async handleClear(player, args) {
        const tier = args[0]?.toLowerCase()

        if (!tier) {
            player.sendMessage("[Manual] Syntax Hint: !broadcast clear <tier>");
            return
        }

        if (!["common", "uncommon", "rare", "legendary"].includes(tier)) {
            player.sendMessage("[Error] Purge failure: Unsupported tier.");
            return
        }

        const success = BroadcastStore.clearTier(tier)
        if (success) {
            player.sendMessage(`[Success] Tier ${tier.toUpperCase()} purged from registry.`);
        } else {
            player.sendMessage("[Fatal] Registry write failure.");
        }
    },

    /* 
     * MANUAL_GENERATOR
     */
    showHelp(player) {
        player.sendMessage("§6§lBROADCAST_SYSTEM_MANUAL")
        player.sendMessage("§7Sub-vectors:")
        player.sendMessage("  §eadd <tier> <content> §7- Injects content.")
        player.sendMessage("  §eremove <tier> <index> §7- Decommissions content.")
        player.sendMessage("  §einterval <seconds> §7- Calibrates delay.")
        player.sendMessage("  §etest [tier] §7- Dispatches diagnostic packet.")
        player.sendMessage("  §estats §7- Returns analytics.")
        player.sendMessage("  §eon/start §7- Activates service.")
        player.sendMessage("  §eoff/stop §7- Deactivates service.")
        player.sendMessage("  §ereload §7- Reboots service.")
        player.sendMessage("  §elist [tier] §7- Returns manifest.")
        player.sendMessage("  §eclear <tier> §7- Purges tier.")
    }
}
