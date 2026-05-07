import { world } from "@minecraft/server"

/*
 * Player List Command
 * ----------------------------------------------------------------------------
 * Displays a list of online players and their current status.
 */

export const PlayerListCommand = {
    name: "playerlist",
    description: "View the list of online players",

    usage: "/ae:playerlist",
    permission: "essentials.playerlist",
    category: "Utility",

    /* 
     * MANIFEST_GENERATION_PIPELINE
     */
    execute(_data, player, _args) {
        const players = world.getAllPlayers()
        
        if (players.length === 0) {
            player.sendMessage("§c§l» §7No players online.");
            return
        }

        player.sendMessage(" ")
        player.sendMessage(`§6§lOnline Players §7(${players.length})`)

        
        players.forEach(p => {
            const playtime = getPlaytime(p)
            const status = getPlayerStatus(p)
            player.sendMessage(`§a- ${p.name} §7[${status}§7] §8(${playtime})`)
        })
        player.sendMessage(" ")
    }

}

/* 
 * SESSION_DURATION_RESOLVER
 * Fetches the 'joinTime' property from the player-buffer and calculates 
 * the delta against the current system-clock.
 */
function getPlaytime(player) {
    const joinTime = player.getDynamicProperty("joinTime")
    if (!joinTime) return "UNDEFINED"
    
    const playtimeMs = Date.now() - joinTime
    const hours = Math.floor(playtimeMs / (1000 * 60 * 60))
    const minutes = Math.floor((playtimeMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}

/* 
 * VITALITY_STATE_PROBE
 * Queries the entity's health component and maps the value to an 
 * industrial status identifier.
 */
function getPlayerStatus(player) {
    const health = player.getComponent("health")
    const currentHealth = health?.currentValue || 0
    const maxHealth = health?.effectiveMax || 20
    
    const healthPercent = (currentHealth / maxHealth) * 100
    
    if (healthPercent >= 75) {
        return "§aHealthy"
    } else if (healthPercent >= 25) {
        return "§eHurt"
    } else {
        return "§cCritical"
    }

}
