/**
 * Message Command - Send private messages to players
 */

import { world } from "@minecraft/server"

// Store last message for reply functionality
const lastMessage = new Map()

export const MessageCommand = {
    name: "message",
    description: "Send a private message to a player",
    usage: "!message <player> <message>",
    permission: "essentials.message",
    category: "social",

    execute(data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§cUsage: !message <player> <message>")
            return
        }

        const targetName = args[0]
        const message = args.slice(1).join(" ")

        // Find target player
        const target = [...world.getPlayers()].find(p => 
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found or not online`)
            return
        }

        if (target.id === player.id) {
            player.sendMessage("§cYou cannot send a message to yourself")
            return
        }

        // Store for reply
        lastMessage.set(target.id, player.id)

        // Send messages
        const formattedMessage = formatMessage(player, target, message)
        target.sendMessage(formattedMessage.to)
        player.sendMessage(formattedMessage.from)
    }
}

export const ReplyCommand = {
    name: "reply",
    description: "Reply to the last person who messaged you",
    usage: "!reply <message>",
    permission: "essentials.message",
    category: "social",

    execute(data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§cUsage: !reply <message>")
            return
        }

        const message = args.join(" ")
        const lastSenderId = lastMessage.get(player.id)

        if (!lastSenderId) {
            player.sendMessage("§cNo one has messaged you recently")
            return
        }

        // Find the last sender
        const lastSender = [...world.getPlayers()].find(p => p.id === lastSenderId)
        if (!lastSender) {
            player.sendMessage("§cThe last person who messaged you is no longer online")
            lastMessage.delete(player.id)
            return
        }

        // Store for their reply
        lastMessage.set(lastSenderId, player.id)

        // Send messages
        const formattedMessage = formatMessage(player, lastSender, message)
        lastSender.sendMessage(formattedMessage.to)
        player.sendMessage(formattedMessage.from)
    }
}

function formatMessage(sender, receiver, message) {
    const timestamp = new Date().toLocaleTimeString()
    
    return {
        to: `§8[${timestamp}] §dFrom §e${sender.name}§8: §f${message}`,
        from: `§8[${timestamp}] §dTo §e${receiver.name}§8: §f${message}`
    }
}
