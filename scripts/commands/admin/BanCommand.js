import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: BanCommand                                                       |
// | banishes players. C++ target selectors resolves players instantly.       |
// | no more finding player objects manually. pure beauty.                    |
// ----------------------------------------------------------------------------
export const BanCommand = {
    name: "ban",
    description: "Permanently ban a player",
    usage: "/ae:ban <player> [duration] [reason]",
    permission: "essentials.ban",
    category: "ADMINISTRATION",
    
    // NATIVE SCHEMA DEFINITION
    params: [
        { name: "player", type: Kernel.CustomCommandParamType.PlayerSelector, optional: false },
        { name: "duration", type: Kernel.CustomCommandParamType.String, optional: true },
        { name: "reason", type: Kernel.CustomCommandParamType.String, optional: true }
    ],

    execute(_data, player, args) {
        // target is an actual rich Player object! no more string guessing lookup loops.
        const [target, duration = "permanent", reason = "Breaking the rules"] = args;

        if (!target) {
            player.sendMessage("\xA7c\xA7l» \xA77Syntax Error: Player target required.");
            return;
        }

        // step 1: hierarchy check. check if target is an OP or high-clearance dev so moderators don't ban admins.
        const PermissionManager = Kernel.get("permissions")
        if (PermissionManager && !PermissionManager.canActOn(player, target)) {
            player.sendMessage("\xA7c\xA7l» \xA77Permission Denied: Target is more powerful than you.");
            return
        }

        // step 2: parse the time string. convert '1d' or '2h' to milliseconds.
        const banDuration = parseDuration(duration)
        if (banDuration === null) {
            player.sendMessage(`\xA7c\xA7l» \xA77Invalid duration: '${duration}'`);
            return
        }

        // step 3: build the ban metadata block.
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

        // step 4: commit to the database.
        if (addBan(banData)) {
            // step 5: terminate their session. run kick command on system loop so it doesn't lag.
            Kernel.system.run(() => {
                try {
                    player.runCommand(`kick "${target.name}" \xA7c[BAN]\n\xA7eREASON: ${reason}`)
                } catch (error) {
                    console.error(`[BanCommand] SESSION_TERMINATION_FAILURE: ${error}`)
                }
            })

            // step 6: notify other staff members. broadcast ban event globally.
            const banMessage = formatBanMessage(banData)
            Kernel.world.getAllPlayers().forEach(p => {
                if (PermissionManager?.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(banMessage)
                }
            })

            player.sendMessage(`\xA7a\xA7l» \xA7f${target.name} has been banned.`);
        } else {
            player.sendMessage("\xA7c\xA7l» \xA77Failed to save ban record.");
        }
    }
}

function parseDuration(duration) {
    const durationLower = duration.toLowerCase()
    if (durationLower === "permanent") return 0
    // matches number + h/d/w suffix.
    const match = durationLower.match(/^(\d+)([hdw])$/)
    if (!match) return null
    
    const amount = parseInt(match[1])
    const unit = match[2]
    const multipliers = { 'h': 3600000, 'd': 86400000, 'w': 604800000 }
    return amount * (multipliers[unit] || 0)
}

function addBan(banData) {
    try {
        const bans = getBans()
        bans.push(banData)
        const now = Date.now()
        // clean up expired bans automatically to save space. database cleanups rule.
        const activeBans = bans.filter(ban => ban.expires === 0 || ban.expires > now)
        const Database = Kernel.get("database")
        Database.set("ae:bans", activeBans)
        return true
    } catch (error) {
        console.error(`[BanCommand] BLACKLIST_COMMIT_FAILURE: ${error}`)
        return false
    }
}

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

function formatBanMessage(banData) {
    const durationText = banData.duration === 0 ? "STATUS: PERMANENT" : `DURATION: ${formatTimeRemaining(banData.expires - Date.now())}`
    return `\xA76\xA7l[\xA7eBAN\xA76\xA7l] \xA7r\xA7e${banData.playerName} \xA77was banished by \xA7f${banData.bannedBy}\xA77\n\xA77${durationText}\n\xA77REASON: \xA7f${banData.reason}`
}

function formatTimeRemaining(milliseconds) {
    if (milliseconds <= 0) return "TERMINATED"
    const days = Math.floor(milliseconds / 86400000)
    const hours = Math.floor((milliseconds % 86400000) / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    return days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
