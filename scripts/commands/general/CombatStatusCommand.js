/**
 * Combat Status Command - View combat and killstreak info
 * Smith Forge Rule: Max 100 lines per file
 */

import { isInCombat, getCombatTime } from "../combat/CombatIntegrity.js"
import { getKillstreak } from "../combat/Killstreaks.js"

export const CombatStatusCommand = {
    name: "combat",
    description: "Check combat status and killstreak",
    usage: "!combat",
    permission: "essentials.default",
    category: "general",

    execute(data, player, args) {
        const playerId = player.id
        const inCombat = isInCombat(playerId)
        const combatTime = getCombatTime(playerId)
        const streak = getKillstreak(playerId)

        // Display combat status
        if (inCombat) {
            const secondsLeft = Math.ceil(combatTime / 20)
            player.sendMessage(`§c⚔ In combat! ${secondsLeft}s remaining`)
        } else {
            player.sendMessage("§a✓ Not in combat")
        }

        // Display killstreak
        if (streak > 0) {
            let color = "§a"
            if (streak >= 50) color = "§6§l"
            else if (streak >= 25) color = "§d"
            else if (streak >= 15) color = "§e"
            
            player.sendMessage(`${color}Killstreak: ${streak}`)
        } else {
            player.sendMessage("§7Killstreak: 0")
        }
    }
}

