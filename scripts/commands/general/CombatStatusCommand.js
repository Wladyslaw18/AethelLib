import { isInCombat, getCombatTime } from "../../systems/combat/CombatIntegrity.js"
import { getKillstreak } from "../../systems/combat/Killstreaks.js"

/*
 * COMBAT_THREAT_DIAGNOSTIC
 * ----------------------------------------------------------------------------
 * A utility command for monitoring the active engagement status of an 
 * entity. Queries the CombatIntegrity engine to resolve combat-tag 
 * persistence and the Killstreak registry for active momentum metrics.
 *
 * PHILOSOPHY: Knowledge is power. If you know how long you're tagged, 
 * you know how long you have to survive before the TPA-safety vector 
 * re-activates.
 */
export const CombatStatusCommand = {
    name: "combat",
    description: "Queries the system for active combat-tag and killstreak metrics.",
    usage: "!combat",
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
            player.sendMessage(`[Threat] ACTIVE_ENGAGEMENT | TTL: ${secondsLeft}s`);
        } else {
            player.sendMessage("[Threat] Status: STANDBY");
        }

        /* 
         * MOMENTUM_METRIC_OUTPUT
         */
        if (streak > 0) {
            let color = "§a"
            if (streak >= 50) color = "§6§l"
            else if (streak >= 25) color = "§d"
            else if (streak >= 15) color = "§e"
            
            player.sendMessage(`${color}Current_Momentum (Killstreak): ${streak}`);
        } else {
            player.sendMessage("[Metrics] Current_Momentum: 0");
        }
    }
}
