import { PlayerUtils } from "../../utils/PlayerUtils.js"
import { ReplyCache } from "../../core/cache/CacheManager.js"
import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: MessageCommand                                                   |
// | command definition for the primary P2P encrypted (private) social bridge. |
// | uses the ReplyCache to track conversation threads for the /reply vector. |
// ----------------------------------------------------------------------------
export const MessageCommand = {
    // internal name.
    name: "message",
    // human-readable description.
    description: "Send a private message to a player.",
    // syntax guide.
    usage: "/ae:message <player> <message>",
    // required permission node.
    permission: "essentials.message",
    // command category.
    category: "Social",
    // Intercepted by script for complex string handling.
    native: false,
    // native parameter definitions (greedy word slots to capture full messages).
    parameters: [
        { name: "player", type: "player", optional: false  },
        { name: "message", type: "string", optional: true  }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the social transmission pipeline. handles resolution, caching, and       |
    // | delivery confirmation.                                                   |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // resolve the target player object.
        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)

        // check if target is online.
        if (!target) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Player not found.`);
            return
        }

        // extract the actual message content.
        const message = args.slice(consumedArgs).join(" ")
        if (!message) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:message <player> <message>");
            return
        }
        if (!message) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Message cannot be empty.");
            return
        }

        // check for self-messaging (redundant but kept for protocol).
        if (target.id === player.id) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You can't message yourself.");
            return
        }

        // step 1: thread caching.
        // update the reply pointers for both parties so they can use /reply.
        ReplyCache.set(target.id, player.id)
        ReplyCache.set(player.id, target.id) 

        // THE COMPLIANCE_INJECTION
        const AuditLog = Kernel.get("messageStore")
        if (AuditLog) {
            AuditLog.logPrivateMessage({
                sender: player.name,
                senderId: player.id,
                receiver: target.name,
                receiverId: target.id,
                content: message, // the raw evidence.
                timestamp: Date.now()
            })
        }

        // step 2: secure transmission.
        const formattedMessage = formatMessage(player, target, message)
        // deliver to the receiver.
        target.sendMessage(formattedMessage.to)
        // confirm to the sender.
        player.sendMessage(formattedMessage.from)
    }
}

// ----------------------------------------------------------------------------
// | object: ReplyCommand                                                     |
// | convenience vector for responding to the last active conversation thread. |
// ----------------------------------------------------------------------------
export const ReplyCommand = {
    // internal name.
    name: "reply",
    // human-readable description.
    description: "Reply to the last player who messaged you.",
    // syntax guide.
    usage: "/ae:reply <message>",
    // permission node (matches messaging).
    permission: "essentials.message",
    // command category.
    category: "Social",
    // Intercepted by script for complex string handling.
    native: false,

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | pulls the last sender from the cache and routes a new message to them.   |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // basic input check.
        if (args.length === 0) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:reply <message>");
            return
        }

        const message = args.join(" ")
        // retrieve the last interlocutor from the cache.
        const lastSenderId = ReplyCache.get(player.id)

        // if the cache is empty (no recent messages).
        if (!lastSenderId) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You have no one to reply to.");
            return
        }

        // find the player object.
        const lastSender = [...Kernel.world.getAllPlayers()].find(p => p.id === lastSenderId)
        if (!lastSender) {
            // if they left since the last message.
            player.sendMessage("\u00A7c\u00A7l» \u00A77That player is now offline.");
            // purge the dead cache entry.
            ReplyCache.delete(player.id)
            return
        }

        // refresh the reply thread on their end.
        ReplyCache.set(lastSender.id, player.id)

        // THE COMPLIANCE_INJECTION
        const AuditLog = Kernel.get("messageStore")
        if (AuditLog) {
            AuditLog.logPrivateMessage({
                sender: player.name,
                senderId: player.id,
                receiver: lastSender.name,
                receiverId: lastSender.id,
                content: message, // the raw evidence.
                timestamp: Date.now()
            })
        }

        // route the response.
        const formattedMessage = formatMessage(player, lastSender, message)
        lastSender.sendMessage(formattedMessage.to)
        player.sendMessage(formattedMessage.from)
    }
}

// ----------------------------------------------------------------------------
// | function: formatMessage                                                  |
// | internal formatter for P2P social data. adds temporal metadata and       |
// | directional labels.                                                      |
// ----------------------------------------------------------------------------
function formatMessage(sender, receiver, message) {
    // resolve current engine time.
    const timestamp = new Date().toLocaleTimeString()
    
    return {
        // message as seen by the recipient.
        to: `\u00A78[${timestamp}] \u00A7dFROM \u00A7e${sender.name}\u00A78: \u00A7f${message}`,
        // message as seen by the sender.
        from: `\u00A78[${timestamp}] \u00A7dTO \u00A7e${receiver.name}\u00A78: \u00A7f${message}`
    }
}
