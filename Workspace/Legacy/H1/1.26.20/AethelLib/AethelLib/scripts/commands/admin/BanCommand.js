import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/*
 * Ban Command
 * ----------------------------------------------------------------------------
 * Handles banning players and saving them to the global blacklist.
 */

export const BanCommand = {
    name: "ban",
    description: "Permanently ban a player",

    usage: "/ae:ban <player> [duration] [reason]",
    permission: "essentials.ban",
    category: "ADMINISTRATION",
    parameters: [
        { name: "player", type: "player", optional: true },
        { name: "duration", type: "string", optional: true },
        { name: "reason", type: "string", optional: true }
    ],


    /* 
     * EXCLUSION_EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Syntax Error: Player name required.");
            player.sendMessage("§7Example: /ae:ban PlayerName 1d Spamming");
            return
        }


        const targetName = args[0]
        const duration = args[1] || "permanent"
        const reason = args.slice(2).join(" ") || "Breaking the rules"


        const target = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        if (!target) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found.`);
            return
        }


        /* HIERARCHY_VALIDATION_GATE */
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager.canActOn(player, target)) {
            player.sendMessage("§c§l» §7Permission Denied: Target is more powerful than you.");
            return
        }


        const banDuration = parseDuration(duration)
        if (banDuration === null) {
            player.sendMessage(`§c§l» §7Invalid duration: '${duration}'`);
            return
        }


        /* BLACKLIST_REGISTRATION */
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
            /* SESSION_TERMINATION_VECTOR */
            system.run(() => {
                try {
                    // DISCONNECT_V2: Use native kick command as .disconnect() is deprecated.
                    player.runCommand(`kick "${target.name}" §c[BAN]\n§eREASON: ${reason}`)

                } catch (error) {
                    console.error(`[BanCommand] SESSION_TERMINATION_FAILURE: ${error}`)
                }
            })

            const banMessage = formatBanMessage(banData)
            world.getAllPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(banMessage)
                }
            })

            player.sendMessage(`§a§l» §f${target.name} has been banned.`);
        } else {
            player.sendMessage("§c§l» §7Failed to save ban record.");
        }


    }
}

/* 
 * DURATION_TOKEN_RESOLVER
 */
function parseDuration(duration) {
    const durationLower = duration.toLowerCase()
    if (durationLower === "permanent") return 0
    const match = durationLower.match(/^(\d+)([hdw])$/)
    if (!match) return null
    const amount = parseInt(match[1])
    const unit = match[2]
    const multipliers = { 'h': 3600000, 'd': 86400000, 'w': 604800000 }
    return amount * (multipliers[unit] || 0)
}

/* 
 * BLACKLIST_COMMIT_PROTOCOL
 */
function addBan(banData) {
    try {
        const bans = getBans()
        bans.push(banData)
        const now = Date.now()
        const activeBans = bans.filter(ban => ban.expires === 0 || ban.expires > now)
        const Database = Kernel.get("database")
        Database.set("ae:bans", activeBans)
        return true
    } catch (error) {
        console.error(`[BanCommand] BLACKLIST_COMMIT_FAILURE: ${error}`)
        return false
    }
}

/* 
 * BLACKLIST_MANIFEST_QUERY
 */
function getBans() {
    try {
        const Database = Kernel.get("database")
        const stored = Database.get("ae:bans")
        return stored || []
    } catch (error) {
        console.error(`[BanCommand] BLACKLIST_LOAD_FAILURE: ${error}`)
        return []
    }
}

/* 
 * BROADCAST_NOTIFICATION_ORCHESTRATOR
 */
function formatBanMessage(banData) {
    const durationText = banData.duration === 0 ? "STATUS: PERMANENT" : `DURATION: ${formatTimeRemaining(banData.expires - Date.now())}`
    return `§6§l[§eBAN§6§l] §r§e${banData.playerName} §7was banished by §f${banData.bannedBy}§7\n§7${durationText}\n§7REASON: §f${banData.reason}`
}


/* 
 * TEMPORAL_DELTA_FORMATTER
 */
function formatTimeRemaining(milliseconds) {
    if (milliseconds <= 0) return "TERMINATED"
    const days = Math.floor(milliseconds / 86400000)
    const hours = Math.floor((milliseconds % 86400000) / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    return days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
