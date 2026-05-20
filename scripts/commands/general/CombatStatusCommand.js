import { isInCombat, getCombatTime } from "../../systems/combat/CombatIntegrity.js"
import { getKillstreak } from "../../systems/combat/Killstreaks.js"

// ----------------------------------------------------------------------------
// | object: CombatStatusCommand                                              |
// | command definition for monitoring active threat levels and killstreaks.   |
// | pulls data from the combat integrity engine and streak tracker.           |
// ----------------------------------------------------------------------------
export const CombatStatusCommand = {
    // internal name.
    name: "combat",
    // human-readable description.
    description: "Check your combat status and killstreak.",
    // syntax guide.
    usage: "/ae:combat",
    // required permission level.
    permission: "essentials.default",
    // command category.
    category: "General",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | diagnostic pipeline. checks if the player is currently tagged for PvP    |
    // | and resolves their current kill momentum.                                |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        const playerId = player.id
        // query the combat engine for the boolean tag status and the tick delta.
        const inCombat = isInCombat(playerId)
        const combatTime = getCombatTime(playerId)
        // fetch the numerical streak from the kill-counter.
        const streak = getKillstreak(playerId)

        // step 1: threat level output.
        if (inCombat) {
            // convert internal engine ticks to human-readable seconds (20tps).
            const secondsLeft = Math.ceil(combatTime / 20)
            player.sendMessage(`\u00A7c\u00A7l» \u00A7eIn Combat! \u00A7cTime left: \u00A7f${secondsLeft}s`);
        } else {
            // player is not currently tagged.
            player.sendMessage("\u00A7a\u00A7l» \u00A77Status: \u00A7fSafe");
        }

        // step 2: momentum metric output.
        if (streak > 0) {
            // resolve a color code based on the streak magnitude.
            // 0-14: Green, 15-24: Yellow, 25-49: Purple, 50+: Gold Bold.
            let color = "\u00A7a"
            if (streak >= 50) color = "\u00A76\u00A7l"
            else if (streak >= 25) color = "\u00A7d"
            else if (streak >= 15) color = "\u00A7e"
            
            player.sendMessage(`\u00A76\u00A7l» \u00A7fKillstreak: ${color}${streak}`);
        } else {
            // no active streak.
            player.sendMessage("\u00A76\u00A7l» \u00A7fKillstreak: \u00A770");
        }
    }
}
