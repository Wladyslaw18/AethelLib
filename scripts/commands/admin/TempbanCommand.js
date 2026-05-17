import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: TempbanCommand                                                   |
// | command definition for temporarily banning a player from the server.     |
// | interfaces with the admin service to persist the ban record.             |
// ----------------------------------------------------------------------------
export const TempbanCommand = {
    // internal name.
    name: "tempban",
    // human-readable description.
    description: "Temporarily ban a player",
    // syntax guide.
    usage: "/ae:tempban <playerName> <duration> [reason]",
    // required permission node.
    permission: "essentials.admin.ban",
    // command category.
    category: "admin",
    
    // native parameter definitions for the command parser.
    parameters: [
        { name: "player", type: "player", optional: false  },
        { name: "duration", type: "string", optional: true  },
        { name: "reason",   type: "string", optional: true  }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | processes the temporary ban request.                                     |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // syntax check.
        if (args.length < 2) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:tempban <player> <duration> [reason]")
            player.sendMessage("\xA77Examples: /ae:tempban Wladyslaw18 1d Spamming")
            return
        }

        // resolve the target player.
        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)

        // ensure the target is online.
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${args[0]}' not found or is offline.`)
            return
        }

        // extract duration and reason from the arguments.
        const duration = args[consumedArgs]
        const reason = args.slice(consumedArgs + 1).join(" ") || "No reason provided"

        if (!duration) {
            player.sendMessage("\xA7c\xA7l» \xA77Please provide a duration (e.g. 1h, 1d, 1w).")
            return
        }

        // step 1: hierarchy check.
        const PermissionManager = Kernel.get("permissions")
        if (PermissionManager && !PermissionManager.canActOn(player, target)) {
            player.sendMessage("\xA7cYou do not have enough power to ban this player.")
            return
        }

        // step 2: parse the time token.
        const banDuration = parseDuration(duration)
        if (banDuration === null) {
            player.sendMessage(`\xA7c\xA7l» \xA77Invalid duration: '${duration}'`)
            return
        }

        // step 3: build the ban metadata record.
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

        // step 4: commit to the ban manager.
        const BanManager = Kernel.get("banManager")
        if (BanManager.addBan(banData)) {
            // step 5: disconnect the player immediately.
            Kernel.system.run(() => {
                try {
                    // we use the dimension runCommand as a reliable way to kick.
                    Kernel.world.getDimension("overworld").runCommand(`kick \"${target.name}\" \xA7c\xA7l[TEMPORARY BAN]\n\xA7eReason: ${reason}`)
                } catch (error) {
                    console.error(`Failed to kick tempbanned player ${target.name}: ${error}`)
                }
            })

            // step 6: notify other staff members.
            const banMessage = formatBanMessage(banData)
            Kernel.world.getAllPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(banMessage)
                }
            })

            // confirm to the admin.
            player.sendMessage(`\xA7a\xA7l» \xA7fPlayer '${target.name}' tempbanned for \xA7e${formatTimeRemaining(banDuration)}`)
        } else {
            // fail if the database rejected the record.
            player.sendMessage("\xA7c\xA7l» \xA77Failed to add tempban")
        }
    }
}

// ----------------------------------------------------------------------------
// | function: parseDuration                                                  |
// | converts temporal tokens (h, d, w) into millisecond offsets.             |
// ----------------------------------------------------------------------------
function parseDuration(duration) {
    const durationLower = duration.toLowerCase()
    // regex for number + unit character.
    const match = durationLower.match(/^(\d+)([hdw])$/)
    if (!match) return null

    const amount = parseInt(match[1])
    const unit = match[2]

    // unit multipliers for time calculation.
    const multipliers = {
        'h': 60 * 60 * 1000,    // hours
        'd': 24 * 60 * 60 * 1000, // days  
        'w': 7 * 24 * 60 * 60 * 1000 // weeks
    }

    return amount * (multipliers[unit] || 0)
}

// ----------------------------------------------------------------------------
// | function: formatBanMessage                                               |
// | builds the pretty-printed announcement string for the server logs.       |
// ----------------------------------------------------------------------------
function formatBanMessage(banData) {
    const durationText = formatTimeRemaining(banData.duration)
    return `\xA76\xA7l[\xA7eTEMPBAN\xA76\xA7l] \xA7r${banData.playerName} \xA77was tempbanned by \xA7e${banData.bannedBy}\xA77\n\xA77Duration: \xA7e${durationText}\xA77\n\xA77Reason: \xA7f${banData.reason}`
}

// ----------------------------------------------------------------------------
// | function: formatTimeRemaining                                            |
// | converts millisecond deltas into human-readable strings.                 |
// ----------------------------------------------------------------------------
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
