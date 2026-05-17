import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: BanCommand                                                       |
// | command definition for permanently or temporarily banning a player.       |
// | saves a record in the global database and kicks the player.              |
// ----------------------------------------------------------------------------
export const BanCommand = {
    // internal name.
    name: "ban",
    // human-readable description.
    description: "Permanently ban a player",
    // syntax guide.
    usage: "/ae:ban <player> [duration] [reason]",
    // required permission node.
    permission: "essentials.ban",
    // command category.
    category: "ADMINISTRATION",
    // native parameter definitions.
    parameters: [
        { name: "player", type: "player", optional: true },
        { name: "duration", type: "string", optional: true },
        { name: "reason", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | processes the ban request.                                               |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // basic input validation.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Syntax Error: Player name required.");
            player.sendMessage("\xA77Example: /ae:ban PlayerName 1d Spamming");
            return
        }

        // gather inputs.
        const targetName = args[0]
        // duration defaults to permanent if not specified.
        const duration = args[1] || "permanent"
        // reason defaults to a generic placeholder.
        const reason = args.slice(2).join(" ") || "Breaking the rules"

        // find the player object. they must be online to be banned by this command.
        // for offline bans, use the admin panel or a separate command.
        const target = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${targetName}' not found.`);
            return
        }

        // step 1: hierarchy check.
        const PermissionManager = Kernel.get("permissions")
        if (PermissionManager && !PermissionManager.canActOn(player, target)) {
            player.sendMessage("\xA7c\xA7l» \xA77Permission Denied: Target is more powerful than you.");
            return
        }

        // step 2: parse the time string.
        const banDuration = parseDuration(duration)
        if (banDuration === null) {
            player.sendMessage(`\xA7c\xA7l» \xA77Invalid duration: '${duration}'`);
            return
        }

        // step 3: build the ban metadata object.
        const banData = {
            playerId: target.id,
            playerName: target.name,
            bannedBy: player.name,
            bannedById: player.id,
            reason: reason,
            timestamp: Date.now(),
            duration: banDuration,
            // calculate the expiration date (0 means permanent).
            expires: banDuration === 0 ? 0 : Date.now() + banDuration
        }

        // step 4: commit to the database.
        if (addBan(banData)) {
            // step 5: terminate the player's session.
            system.run(() => {
                try {
                    // execute the native kick command.
                    player.runCommand(`kick "${target.name}" \xA7c[BAN]\n\xA7eREASON: ${reason}`)
                } catch (error) {
                    // log if the kick fails (rare).
                    console.error(`[BanCommand] SESSION_TERMINATION_FAILURE: ${error}`)
                }
            })

            // step 6: notify other staff members.
            const banMessage = formatBanMessage(banData)
            world.getAllPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(banMessage)
                }
            })

            // confirm to the sender.
            player.sendMessage(`\xA7a\xA7l» \xA7f${target.name} has been banned.`);
        } else {
            // fail if the database write fails.
            player.sendMessage("\xA7c\xA7l» \xA77Failed to save ban record.");
        }
    }
}

// ----------------------------------------------------------------------------
// | function: parseDuration                                                  |
// | converts strings like '1d', '2h', or '3w' into milliseconds.            |
// ----------------------------------------------------------------------------
function parseDuration(duration) {
    const durationLower = duration.toLowerCase()
    // handle permanent keyword.
    if (durationLower === "permanent") return 0
    // regex to match number + unit character.
    const match = durationLower.match(/^(\d+)([hdw])$/)
    if (!match) return null
    
    const amount = parseInt(match[1])
    const unit = match[2]
    // multipliers for hours, days, and weeks.
    const multipliers = { 'h': 3600000, 'd': 86400000, 'w': 604800000 }
    return amount * (multipliers[unit] || 0)
}

// ----------------------------------------------------------------------------
// | function: addBan                                                         |
// | internal helper to push a new ban record into the global list.           |
// | also performs a sweep to remove expired bans from the storage.           |
// ----------------------------------------------------------------------------
function addBan(banData) {
    try {
        // load existing blacklist.
        const bans = getBans()
        // append the new record.
        bans.push(banData)
        const now = Date.now()
        // filter out any records that have already expired to save space.
        const activeBans = bans.filter(ban => ban.expires === 0 || ban.expires > now)
        const Database = Kernel.get("database")
        // save back to the database.
        Database.set("ae:bans", activeBans)
        return true
    } catch (error) {
        // log if the database write fails.
        console.error(`[BanCommand] BLACKLIST_COMMIT_FAILURE: ${error}`)
        return false
    }
}

// ----------------------------------------------------------------------------
// | function: getBans                                                        |
// | fetches the full blacklist array from the database.                      |
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// | function: formatBanMessage                                               |
// | builds the pretty-printed announcement string for staff.                 |
// ----------------------------------------------------------------------------
function formatBanMessage(banData) {
    // format the duration text.
    const durationText = banData.duration === 0 ? "STATUS: PERMANENT" : `DURATION: ${formatTimeRemaining(banData.expires - Date.now())}`
    // return the multi-line colored announcement.
    return `\xA76\xA7l[\xA7eBAN\xA76\xA7l] \xA7r\xA7e${banData.playerName} \xA77was banished by \xA7f${banData.bannedBy}\xA77\n\xA77${durationText}\n\xA77REASON: \xA7f${banData.reason}`
}

// ----------------------------------------------------------------------------
// | function: formatTimeRemaining                                            |
// | converts millisecond deltas into human-readable strings (e.g. 1d 2h).    |
// ----------------------------------------------------------------------------
function formatTimeRemaining(milliseconds) {
    // check if it's already over.
    if (milliseconds <= 0) return "TERMINATED"
    // calculate days, hours, and minutes.
    const days = Math.floor(milliseconds / 86400000)
    const hours = Math.floor((milliseconds % 86400000) / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    
    // return the most significant units.
    return days > 0 ? `${days}d ${hours}h ${minutes}m` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
