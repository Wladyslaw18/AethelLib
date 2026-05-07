import { isInCombat, getCombatTime } from "../../systems/combat/CombatIntegrity.js"
import { getKillstreak } from "../../systems/combat/Killstreaks.js"

/*
 * Combat Status Command
 * ----------------------------------------------------------------------------
 * Displays the player's current combat tag time and active killstreak.
 */

export const CombatStatusCommand = {
    name: "combat",
    description: "Check your combat status and killstreak.",

    usage: "/ae:combat",
    permission: "essentials.default",
    category: "General",

    /* 
     * DIAGNOSTIC_PIPELINE
     */
    execute(_data, player, _args) {
        const playerId = player.id
        const inCombat = isInCombat(playerId)
        const combatTime = getCombatTime(playerId)
        const streak = getKillstreak(playerId)

        /* 
         * THREAT_LEVEL_OUTPUT
         */
        if (inCombat) {
            const secondsLeft = Math.ceil(combatTime / 20)
            player.sendMessage(`§c§l» §eIn Combat! §cTime left: §f${secondsLeft}s`);
        } else {
            player.sendMessage("§a§l» §7Status: §fSafe");
        }


        /* 
         * MOMENTUM_METRIC_OUTPUT
         */
        if (streak > 0) {
            let color = "§a"
            if (streak >= 50) color = "§6§l"
            else if (streak >= 25) color = "§d"
            else if (streak >= 15) color = "§e"
            
            player.sendMessage(`§6§l» §fKillstreak: ${color}${streak}`);
        } else {
            player.sendMessage("§6§l» §fKillstreak: §70");
        }

    }
}
