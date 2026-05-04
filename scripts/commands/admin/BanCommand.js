/**
 * Ban Command - Ban players from server
 */

import { system, world } from "@minecraft/server"

export const BanCommand = {
    name: "ban",
    description: "Ban a player from the server",
    usage: "!ban <player> [duration] [reason]",
    permission: "essentials.ban",
    category: "admin",

    execute(data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§cUsage: !ban <player> [duration] [reason]")
            player.sendMessage("§7Duration examples: 1h, 1d, 1w, permanent")
            return
        }

        const targetName = args[0]
        const duration = args[1] || "permanent"
        const reason = args.slice(2).join(" ") || "No reason provided"

        const target = world.getPlayers().find(p =>
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found`)
            return
        }

        // Check permissions
        if (target.hasTag("admin") && !player.hasTag("owner")) {
            player.sendMessage("§cYou cannot ban other admins")
            return
        }

        const banDuration = parseDuration(duration)
        if (banDuration === null) {
            player.sendMessage(`§cInvalid duration: §e${duration}`)
            return
        }

        // Perform ban
        const banData = {
            playerId: target.id,
            playerName: target.name,
            bannedBy: player.name,
            bannedById: player.id,
            reason: reason,
            timestamp: Date.now(),
            duration: banDuration,
            expires: banDuration === 0 ? 0 : Date.now() + banDuration
        }

        if (addBan(banData)) {
            // Kick player if online
            system.run(() => {
                try {
                    // Use the kick command instead of invalid player.remove()
                    target.runCommand(`kick "${target.name}" You have been banned: ${reason}`)
                } catch (error) {
                    console.error(`Failed to kick banned player ${targetName}: ${error}`)
                }
            })

            // Announce ban
            const banMessage = formatBanMessage(banData)
            world.getPlayers().forEach(p => {
                if (p.hasTag("admin") || p === player) {
                    p.sendMessage(banMessage)
                }
            })

            player.sendMessage(`§aSuccessfully banned §e${target.name}`)
        } else {
            player.sendMessage("§cFailed to add ban")
        }
    }
}

function parseDuration(duration) {
    const durationLower = duration.toLowerCase()

    if (durationLower === "permanent") return 0

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
        console.error(`Failed to add ban: ${error}`)
        return false
    }
}

function getBans() {
    try {
        const stored = world.getDynamicProperty("ae:bans")
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error(`Failed to load bans: ${error}`)
        return []
    }
}

function formatBanMessage(banData) {
    const durationText = banData.duration === 0 ?
        "Permanent" :
        formatTimeRemaining(banData.expires - Date.now())

    return `§6§l[§eBAN§6§l] §r${banData.playerName} §7was banned by §e${banData.bannedBy}§7\n§7Duration: §e${durationText}§7\n§7Reason: §f${banData.reason}`
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

