import { world } from "@minecraft/server"

/*
 * IDENTITY_MESSAGING_BRIDGE
 * ----------------------------------------------------------------------------
 * A high-performance communication vector for private data-relay between 
 * entities. Implements a reply-buffer to track the last-known interaction 
 * partner for O(1) back-and-forth messaging.
 *
 * PHILOSOPHY: Private communication must be secure and low-latency. 
 * We bypass the global chat event-bus to ensure message privacy.
 */

const lastMessage = new Map() // INTERACTION_HANDSHAKE_BUFFER

export const MessageCommand = {
    name: "message",
    description: "Relays a private data-packet to a specific entity.",
    usage: "!message <player_identifier> <content>",
    permission: "essentials.message",
    category: "Social",

    /* 
     * MESSAGE_DISPATCH_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("[Manual] Syntax Error: Player and content required.");
            return
        }

        const targetName = args[0]
        const message = args.slice(1).join(" ")

        /* 
         * ENTITY_RESOLUTION_ENGINE
         */
        const target = [...world.getPlayers()].find(p => 
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`[Error] Entity '${targetName}' not found or offline.`);
            return
        }

        if (target.id === player.id) {
            player.sendMessage("[Error] Circular messaging not permitted.");
            return
        }

        /* 
         * HANDSHAKE_REGISTRATION
         */
        lastMessage.set(target.id, player.id)

        const formattedMessage = formatMessage(player, target, message)
        target.sendMessage(formattedMessage.to)
        player.sendMessage(formattedMessage.from)
    }
}

/* 
 * REPLY_LOGIC_GATE
 */
export const ReplyCommand = {
    name: "reply",
    description: "Invokes a return-packet to the last interaction partner.",
    usage: "!reply <content>",
    permission: "essentials.message",
    category: "Social",

    execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("[Manual] Syntax Error: Content required.");
            return
        }

        const message = args.join(" ")
        const lastSenderId = lastMessage.get(player.id)

        if (!lastSenderId) {
            player.sendMessage("[Error] No active interaction handshake found.");
            return
        }

        const lastSender = [...world.getPlayers()].find(p => p.id === lastSenderId)
        if (!lastSender) {
            player.sendMessage("[Error] Interaction partner has disconnected.");
            lastMessage.delete(player.id)
            return
        }

        lastMessage.set(lastSenderId, player.id)

        const formattedMessage = formatMessage(player, lastSender, message)
        lastSender.sendMessage(formattedMessage.to)
        player.sendMessage(formattedMessage.from)
    }
}

/* 
 * PACKET_FORMATTER
 * Wraps the raw message string in a standardized industrial visual frame.
 */
function formatMessage(sender, receiver, message) {
    const timestamp = new Date().toLocaleTimeString()
    
    return {
        to: `§8[${timestamp}] §dFROM §e${sender.name}§8: §f${message}`,
        from: `§8[${timestamp}] §dTO §e${receiver.name}§8: §f${message}`
    }
}
