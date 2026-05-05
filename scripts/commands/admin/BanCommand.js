import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_IDENTITY_TERMINATION_VECTOR
 * ----------------------------------------------------------------------------
 * Handles the administrative exclusion protocol. Performs rigorous 
 * hierarchy-validation before committing the target entity's identifier 
 * to the persistent blacklist manifest ('ae:bans'). 
 *
 * PHILOSOPHY: Non-compliance is a breach of industrial integrity. 
 * Banning is the definitive decommissioning of corrupted assets.
 */
export const BanCommand = {
    name: "ban",
    description: "Decommissions a specific entity identifier from the industrial buffer.",
    usage: "!ban <player_identifier> [duration_token] [reason_manifest]",
    permission: "essentials.ban",
    category: "ADMINISTRATION",

    /* 
     * EXCLUSION_EXECUTION_PIPELINE
     */
    execute(player, args) {
        if (args.length === 0) {
            player.sendMessage("§cERROR: PLAYER_IDENTIFIER_REQUIRED");
            player.sendMessage("§7Duration_Tokens: 1h (hour), 1d (day), 1w (week), permanent");
            return
        }

        const targetName = args[0]
        const duration = args[1] || "permanent"
        const reason = args.slice(2).join(" ") || "INDUSTRIAL_PROTOCOL_BREACH"

        const target = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        if (!target) {
            player.sendMessage(`§cERROR: ENTITY_NOT_FOUND_IN_BUFFER: '${targetName}'`);
            return
        }

        /* HIERARCHY_VALIDATION_GATE */
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager.canActOn(player, target)) {
            player.sendMessage("§cAUTHORITY_PARADOX: TARGET_CLEARANCE_LEVEL_EXCEEDS_ACTOR");
            return
        }

        const banDuration = parseDuration(duration)
        if (banDuration === null) {
            player.sendMessage(`§cERROR: MALFORMED_DURATION_TOKEN: '${duration}'`);
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
                    // @ts-ignore
                    target.disconnect(`§c[INDUSTRIAL_EXCLUSION] ACCESS_TERMINATED\n§eREASON: ${reason}`)
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

            player.sendMessage(`§aSUCCESS: Identity '${target.name}' decommissioned.`);
        } else {
            player.sendMessage("§cERROR: BLACKLIST_MANIFEST_COMMIT_FAILURE");
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
        world.setDynamicProperty("ae:bans", JSON.stringify(activeBans))
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
        const stored = world.getDynamicProperty("ae:bans")
        return (typeof stored === "string") ? JSON.parse(stored) : []
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
    return `§6§l[§eDECOMMISSION§6§l] §r§e${banData.playerName} §7WAS PURGED BY §f${banData.bannedBy}§7\n§7${durationText}\n§7REASON: §f${banData.reason}`
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
