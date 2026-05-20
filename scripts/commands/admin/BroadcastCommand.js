import { BroadcastStore } from "../../systems/broadcasts/BroadcastStore.js"
import { BroadcastService } from "../../systems/broadcasts/BroadcastService.js"

// ----------------------------------------------------------------------------
// | object: BroadcastCommand                                                 |
// | administrative interface for managing the automated message relay system. |
// | supports multiple tiers, variable intervals, and live system control.     |
// ----------------------------------------------------------------------------
export const BroadcastCommand = {
    // internal identifier.
    name: "broadcast",
    // human-readable explanation.
    description: "Manage automatic server broadcasts",
    // how to use it.
    usage: "/ae:broadcast <subcommand> [args...]",
    // required permission level.
    permission: "essentials.admin",
    // organization category.
    category: "Admin",
    // Intercepted by script for complex string handling.
    native: false,
    // shorthand aliases.
    aliases: ["bc"],
    // parameter definitions for the native parser.
    // we use generic string slots because subcommands vary in length.
    parameters: [
        { name: "subcommand", type: "string", optional: true },
        { name: "arg1",       type: "string", optional: true },
        { name: "arg2",       type: "string", optional: true },
        { name: "arg3",       type: "string", optional: true },
        { name: "arg4",       type: "string", optional: true },
        { name: "arg5",       type: "string", optional: true },
        { name: "arg6",       type: "string", optional: true },
        { name: "arg7",       type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | routes the request to the appropriate subcommand handler.                |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // get the subcommand from the first argument slot.
        const subcommand = args[0]?.toLowerCase()

        // if no subcommand, show the help menu.
        if (!subcommand) {
            this.showHelp(player)
            return
        }

        // routing logic.
        switch (subcommand) {
            case "add":
                // add a new message to a specific tier.
                await this.handleAdd(player, args.slice(1))
                break
            case "remove":
                // delete a message by its index.
                await this.handleRemove(player, args.slice(1))
                break
            case "interval":
                // change the delay between broadcasts.
                await this.handleInterval(player, args.slice(1))
                break
            case "test":
                // trigger an immediate broadcast for testing.
                await this.handleTest(player, args.slice(1))
                break
            case "stats":
                // show system health and performance.
                await this.handleStats(player)
                break
            case "start":
            case "on":
                // enable the background worker.
                await this.handleStart(player)
                break
            case "stop":
            case "off":
                // disable the background worker.
                await this.handleStop(player)
                break
            case "reload":
                // restart the system to refresh config.
                await this.handleReload(player)
                break
            case "list":
                // list all messages in a tier.
                await this.handleList(player, args.slice(1))
                break
            case "clear":
                // wipe an entire tier.
                await this.handleClear(player, args.slice(1))
                break
            default:
                // unknown command.
                player.sendMessage(`\u00A7cERROR: Unknown subcommand: '${subcommand}'`);
                this.showHelp(player)
        }
    },

    // ----------------------------------------------------------------------------
    // | method: handleAdd                                                        |
    // | adds a new string to the broadcast rotation.                             |
    // ----------------------------------------------------------------------------
    async handleAdd(player, args) {
        const tier = args[0]?.toLowerCase()
        // join the remaining arguments to form the message content.
        const message = args.slice(1).filter(Boolean).join(" ")

        if (!tier || !message) {
            player.sendMessage("\u00A77Usage: /ae:bc add <tier> <content>");
            return
        }

        // save to the persistent store.
        const success = BroadcastStore.addMessage(tier, message)
        if (success) {
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fMessage added to \u00A7e${tier}\u00A7f tier.`);
        } else {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Invalid tier.");
        }
    },

    // ----------------------------------------------------------------------------
    // | method: handleRemove                                                     |
    // | removes a message from the rotation by its numerical index.              |
    // ----------------------------------------------------------------------------
    async handleRemove(player, args) {
        const tier = args[0]?.toLowerCase()
        const index = parseInt(args[1])

        if (!tier || isNaN(index)) {
            player.sendMessage("\u00A77Usage: /ae:bc remove <tier> <index>");
            return
        }

        // delete from the store.
        const success = BroadcastStore.removeMessage(tier, index)
        if (success) {
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fMessage removed from \u00A7e${tier}\u00A7f tier.`);
        } else {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Invalid index.");
        }
    },

    // ----------------------------------------------------------------------------
    // | method: handleInterval                                                   |
    // | updates the timer for the background service.                            |
    // ----------------------------------------------------------------------------
    async handleInterval(player, args) {
        const seconds = parseInt(args[0])

        // enforce a 10s floor to prevent spam/lag.
        if (isNaN(seconds) || seconds < 10) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Minimum interval is 10s.");
            return
        }

        // update the store.
        const success = BroadcastStore.setInterval(seconds)
        if (success) {
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fBroadcast interval set to \u00A7e${seconds}s\u00A7f.`);
            // if the service is currently running, we need to push the new config live.
            if (BroadcastService.isRunning()) {
                BroadcastService.updateConfig(BroadcastStore.getConfig())
            }
        }
    },

    // ----------------------------------------------------------------------------
    // | method: handleTest                                                       |
    // | triggers a one-off broadcast to the sender for validation.               |
    // ----------------------------------------------------------------------------
    async handleTest(player, args) {
        // default to 'common' tier if not specified.
        const tier = args[0]?.toLowerCase() || "common"
        BroadcastService.testBroadcast(tier, player)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fSending \u00A7e${tier}\u00A7f test broadcast...`);
    },

    // ----------------------------------------------------------------------------
    // | method: handleStats                                                      |
    // | displays information about the service state and message counts.         |
    // ----------------------------------------------------------------------------
    async handleStats(player) {
        const serviceStats = BroadcastService.getStats()
        const storeStats = BroadcastStore.getStats()

        player.sendMessage(" ")
        player.sendMessage("\u00A76\u00A7lBroadcast Stats")
        player.sendMessage(`\u00A77Status: ${serviceStats.running ? "\u00A7aRunning" : "\u00A7cStopped"}`)
        player.sendMessage(`\u00A77Interval: \u00A7e${storeStats.interval}s`)
        // check how much time is left on the current timer.
        player.sendMessage(`\u00A77Next: \u00A7e${BroadcastService.getTimeUntilNext()}`)
        // lifetime count since last reload.
        player.sendMessage(`\u00A77Total: \u00A7e${serviceStats.totalBroadcasts}`)
    },

    // ----------------------------------------------------------------------------
    // | system controls                                                          |
    // | methods to start, stop, and reload the background service.               |
    // ----------------------------------------------------------------------------
    
    async handleStart(player) {
        if (BroadcastService.isRunning()) return
        BroadcastService.init()
        player.sendMessage("\u00A7a\u00A7l» \u00A7fBroadcast system started.");
    },

    async handleStop(player) {
        if (!BroadcastService.isRunning()) return
        BroadcastService.stop()
        player.sendMessage("\u00A76\u00A7l» \u00A77Broadcast system stopped.");
    },

    async handleReload(player) {
        // cycle the service.
        if (BroadcastService.isRunning()) BroadcastService.stop()
        BroadcastService.init()
        player.sendMessage("\u00A7a\u00A7l» \u00A7fBroadcast system reloaded.");
    },

    // ----------------------------------------------------------------------------
    // | method: handleList                                                       |
    // | shows all messages or a summary of tiers.                                |
    // ----------------------------------------------------------------------------
    async handleList(player, args) {
        const tier = args[0]?.toLowerCase()
        if (tier) {
            // list specific messages in a tier.
            const messages = BroadcastStore.getMessages(tier)
            player.sendMessage(" ")
            player.sendMessage(`\u00A76\u00A7lBroadcast List: \u00A7e${tier.toUpperCase()}`)
            messages.forEach((m, i) => player.sendMessage(`\u00A77[${i}] \u00A7f${m}`))
        } else {
            // show counts for all tiers.
            const stats = BroadcastStore.getStats()
            player.sendMessage(" ")
            player.sendMessage("\u00A76\u00A7lBroadcast Summary")
            for (const [t, c] of Object.entries(stats.messagesByTier)) {
                player.sendMessage(`\u00A77${t.toUpperCase()}: \u00A7e${c}`)
            }
        }
    },

    // wipe an entire tier of messages.
    async handleClear(player, args) {
        const tier = args[0]?.toLowerCase()
        if (!tier) return
        BroadcastStore.clearTier(tier)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fBroadcast tier \u00A7e${tier}\u00A7f cleared.`);
    },

    // ----------------------------------------------------------------------------
    // | method: showHelp                                                         |
    // | prints the subcommand syntax to the player chat.                         |
    // ----------------------------------------------------------------------------
    showHelp(player) {
        player.sendMessage(" ")
        player.sendMessage("\u00A76\u00A7lBroadcast Help")
        player.sendMessage("\u00A77/ae:bc add <tier> <msg>")
        player.sendMessage("\u00A77/ae:bc remove <tier> <idx>")
        player.sendMessage("\u00A77/ae:bc interval <sec>")
        player.sendMessage("\u00A77/ae:bc test [tier]")
        player.sendMessage("\u00A77/ae:bc stats")
        player.sendMessage("\u00A77/ae:bc on | off")
        player.sendMessage("\u00A77/ae:bc reload")
        player.sendMessage("\u00A77/ae:bc list [tier]")
        player.sendMessage(" ")
    }
}
