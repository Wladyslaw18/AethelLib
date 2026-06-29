import { world } from "@minecraft/server"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

/*
 * IDENTITY_MESSAGING_BRIDGE
 */

const lastMessage = new Map() // INTERACTION_HANDSHAKE_BUFFER

export const MessageCommand = {
    name: "message",
    description: "Send a private message to a player.",
    usage: "/ae:message <player> <message>",
    permission: "essentials.message",
    category: "Social",
    parameters: [
        { name: "player", type: "player", optional: false  },
        { name: "word1",  type: "string", optional: true  },
        { name: "word2",  type: "string", optional: true  },
        { name: "word3",  type: "string", optional: true  },
        { name: "word4",  type: "string", optional: true  },
        { name: "word5",  type: "string", optional: true  },
        { name: "word6",  type: "string", optional: true  }
    ],

    async execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:message <player> <message>");
            player.sendMessage("§e§l» §fTip: §7You can use /ae:reply to respond.");
            return
        }


        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)

        if (!target) {
            player.sendMessage(`§c§l» §7Player '${args[0]}' not found.`);
            return
        }


        const message = args.slice(consumedArgs).join(" ")
        if (!message) {
            player.sendMessage("§c§l» §7Message cannot be empty.");
            return
        }


        if (target.id === player.id) {
            player.sendMessage("§c§l» §7You can't message yourself.");
            return
        }


        lastMessage.set(target.id, player.id)
        lastMessage.set(player.id, target.id) // Dual-link for easier replying

        if (lastMessage.size > 2000) {
            let i = 0;
            for (const key of lastMessage.keys()) {
                lastMessage.delete(key);
                if (++i > 500) break;
            }
        }

        const formattedMessage = formatMessage(player, target, message)
        target.sendMessage(formattedMessage.to)
        player.sendMessage(formattedMessage.from)
    }
}

export const ReplyCommand = {
    name: "reply",
    description: "Reply to the last player who messaged you.",
    usage: "/ae:reply <message>",

    permission: "essentials.message",
    category: "Social",

    execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:reply <message>");
            return
        }


        const message = args.join(" ")
        const lastSenderId = lastMessage.get(player.id)

        if (!lastSenderId) {
            player.sendMessage("§c§l» §7You have no one to reply to.");
            return
        }


        const lastSender = [...world.getAllPlayers()].find(p => p.id === lastSenderId)
        if (!lastSender) {
            player.sendMessage("§c§l» §7That player is now offline.");
            lastMessage.delete(player.id)
            return
        }


        lastMessage.set(lastSender.id, player.id)

        const formattedMessage = formatMessage(player, lastSender, message)
        lastSender.sendMessage(formattedMessage.to)
        player.sendMessage(formattedMessage.from)
    }
}

function formatMessage(sender, receiver, message) {
    const timestamp = new Date().toLocaleTimeString()
    
    return {
        to: `§8[${timestamp}] §dFROM §e${sender.name}§8: §f${message}`,
        from: `§8[${timestamp}] §dTO §e${receiver.name}§8: §f${message}`
    }
}

