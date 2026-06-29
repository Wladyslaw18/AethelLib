/**
 * Tempban Command - Temporarily ban a player
 */

import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

export const TempbanCommand = {
    name: "tempban",
    description: "Temporarily ban a player",
    usage: "/ae:tempban <playerName> <duration> [reason]",
    permission: "essentials.admin.ban",
    category: "admin",
    parameters: [
        { name: "player", type: "player", optional: false  },
        { name: "duration", type: "string", optional: true  },
        { name: "reason",   type: "string", optional: true  }
    ],

    execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:tempban <player> <duration> [reason]")
            player.sendMessage("§7Examples: /ae:tempban Wladyslaw18 1d Spamming")
            return
        }

        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)

        if (!target) {
            player.sendMessage(`§c§l» §7Player '${args[0]}' not found or is offline.`)
            return
        }

        const duration = args[consumedArgs]
        const reason = args.slice(consumedArgs + 1).join(" ") || "No reason provided"

        if (!duration) {
            player.sendMessage("§c§l» §7Please provide a duration (e.g. 1h, 1d, 1w).")
            return
        }


        // Check permissions (Hierarchy Check)
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager.canActOn(player, target)) {
            player.sendMessage("§cYou do not have enough power to ban this player.")
            return
        }

        const banDuration = parseDuration(duration)
        if (banDuration === null) {
            player.sendMessage(`§c§l» §7Invalid duration: '${duration}'`)
            return
        }


        // Perform tempban
        const banData = {
            playerId: target.id,
            playerName: target.name,
            bannedBy: player.name,
            bannedById: player.id,
            reason: reason,
            timestamp: Date.now(),
            duration: banDuration,
            expires: Date.now() + banDuration,
            temp: true
        }

        const BanManager = Kernel.get("admin")
        if (BanManager.addBan(banData)) {
            // Kick player immediately
            Kernel.system.run(() => {
                try {
                    // INDUSTRIAL_TERMINATION_PROTOCOL
                    // We use system.runCommand to ensure the kick executes with elevated administrative permissions.
                    Kernel.system.runCommand(`kick \"${target.name}\" §c§l[TEMPORARY BAN]\n§eReason: ${reason}`)

                } catch (error) {
                    console.error(`Failed to kick tempbanned player ${target.name}: ${error}`)
                }
            })

            // Announce tempban
            const banMessage = formatBanMessage(banData)
            const PermissionManager = Kernel.get("permissions")
            Kernel.world.getAllPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(banMessage)
                }
            })

            player.sendMessage(`§a§l» §fPlayer '${target.name}' tempbanned for §e${formatTimeRemaining(banDuration)}`)
        } else {
            player.sendMessage("§c§l» §7Failed to add tempban")
        }

    }
}

function parseDuration(duration) {
    const durationLower = duration.toLowerCase()

    const match = durationLower.match(/^(\d+)([hdw])$/)
    if (!match) return null

    const amount = parseInt(match[1])
    const unit = match[2]

    const multipliers = {
        'h': 60 * 60 * 1000,    // hours
        'd': 24 * 60 * 60 * 1000, // days  
        'w': 7 * 24 * 60 * 60 * 1000 // weeks
    }

    return amount * (multipliers[unit] || 0)
}

function getBans() {
    const BanManager = Kernel.get("admin")
    return BanManager.getBans()
}

function formatBanMessage(banData) {
    const durationText = formatTimeRemaining(banData.duration)

    return `§6§l[§eTEMPBAN§6§l] §r${banData.playerName} §7was tempbanned by §e${banData.bannedBy}§7\n§7Duration: §e${durationText}§7\n§7Reason: §f${banData.reason}`
}

function formatTimeRemaining(milliseconds) {
    if (milliseconds <= 0) return "Expired"

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}


