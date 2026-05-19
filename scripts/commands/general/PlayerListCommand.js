import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: PlayerListCommand                                                |
// | command definition for displaying the active session manifest.            |
// | provides a snapshot of online players, their health status, and playtime. |
// ----------------------------------------------------------------------------
export const PlayerListCommand = {
    // internal name.
    name: "playerlist",
    // human-readable description.
    description: "View the list of online players",
    // syntax guide.
    usage: "/ae:playerlist",
    // required permission node.
    permission: "essentials.playerlist",
    // command category.
    category: "Utility",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the manifest generation pipeline. iterates through all online entities    |
    // | and resolves their individual status metadata.                           |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // pull all active player objects.
        const players = Kernel.world.getAllPlayers()
        
        // safety check for empty server (though unlikely if executing this).
        if (players.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77No players online.");
            return
        }

        // header display.
        player.sendMessage(" ")
        player.sendMessage(`\xA76\xA7lOnline Players \xA77(${players.length})`)

        // loop through and resolve metadata for each player.
        players.forEach(p => {
            // resolve session duration.
            const playtime = getPlaytime(p)
            // resolve health/vitality status.
            const status = getPlayerStatus(p)
            // print the formatted line.
            player.sendMessage(`\xA7a- ${p.name} \xA77[${status}\xA77] \xA78(${playtime})`)
        })
        player.sendMessage(" ")
    }
}

// ----------------------------------------------------------------------------
// | function: getPlaytime                                                    |
// | resolves human-readable session duration from the player's join stamp.    |
// ----------------------------------------------------------------------------
function getPlaytime(player) {
    // fetch the player-specific store from the kernel.
    const PlayerStore = Kernel.get("playerStore")
    // pull the join time (millisecond stamp).
    let joinTime = PlayerStore.get(player, "joinTime")
    // fallback if for some reason the join event didn't fire.
    if (!joinTime) {
        joinTime = Date.now()
        PlayerStore.set(player, "joinTime", joinTime)
    }
    
    // calculate delta.
    const playtimeMs = Date.now() - joinTime
    const hours = Math.floor(playtimeMs / (1000 * 60 * 60))
    const minutes = Math.floor((playtimeMs % (1000 * 60 * 60)) / (1000 * 60))
    
    // return formatted string.
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}

// ----------------------------------------------------------------------------
// | function: getPlayerStatus                                                |
// | queries the entity's health component and maps it to a color-coded label. |
// ----------------------------------------------------------------------------
function getPlayerStatus(player) {
    // resolve native health component.
    const health = player.getComponent("health")
    const currentHealth = health?.currentValue || 0
    const maxHealth = health?.effectiveMax || 20
    
    // calculate percentage for tiered mapping.
    const healthPercent = (currentHealth / maxHealth) * 100
    
    // map to industrial status identifiers.
    if (healthPercent >= 75) {
        return "\xA7aHealthy"
    } else if (healthPercent >= 25) {
        return "\xA7eHurt"
    } else {
        return "\xA7cCritical"
    }
}
