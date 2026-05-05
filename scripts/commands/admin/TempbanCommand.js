/**
 * Tempban Command - Temporarily ban a player
 */

import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

export const TempbanCommand = {
    name: "tempban",
    description: "Temporarily ban a player",
    usage: "!tempban <playerName> <duration> [reason]",
    permission: "essentials.admin.ban",
    category: "admin",

    execute(player, args) {
        if (args.length === 0) {
            player.sendMessage("§cUsage: !tempban <playerName> <duration> [reason]")
            player.sendMessage("§7Duration examples: 1h, 1d, 1w")
            return
        }

        const targetName = args[0]
        const duration = args[1]
        const reason = args.slice(2).join(" ") || "No reason provided"

        const target = world.getPlayers().find(p =>
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found`)
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
            player.sendMessage(`§cInvalid duration: §e${duration}`)
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

        if (addBan(banData)) {
            // Kick player immediately
            system.run(() => {
                try {
                    // @ts-ignore
                    target.disconnect(`§c[INDUSTRIAL_EXCLUSION] ACCESS_TERMINATED\n§eREASON: ${reason}`)
                } catch (error) {
                    console.error(`Failed to kick tempbanned player ${targetName}: ${error}`)
                }
            })

            // Announce tempban
            const banMessage = formatBanMessage(banData)
            const PermissionManager = Kernel.get("permissions")
            world.getPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(banMessage)
                }
            })

            player.sendMessage(`§aSuccessfully tempbanned §e${target.name} §7for §e${formatTimeRemaining(banDuration)}`)
        } else {
            player.sendMessage("§cFailed to add tempban")
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

function addBan(banData) {
    try {
        const bans = getBans()
        bans.push(banData)

        // Remove expired bans
        const now = Date.now()
        const activeBans = bans.filter(ban =>
            ban.expires === 0 || ban.expires > now
        )

        world.setDynamicProperty("ae:bans", JSON.stringify(activeBans))
        return true
    } catch (error) {
        console.error(`Failed to add tempban: ${error}`)
        return false
    }
}

function getBans() {
    try {
        const stored = world.getDynamicProperty("ae:bans")
        return (typeof stored === "string") ? JSON.parse(stored) : []
    } catch (error) {
        console.error(`Failed to load bans: ${error}`)
        return []
    }
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

