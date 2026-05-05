import { world } from "@minecraft/server"

/*
 * ENTITY_MANIFEST_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Performs a global scan of the active player-buffer. Generates a manifest 
 * documenting entity identifiers, session-duration (playtime), and 
 * vitality-state (health-status).
 *
 * PHILOSOPHY: Knowledge of your peers is essential for industrial 
 * coordination. Or for identifying targets.
 */
export const PlayerListCommand = {
    name: "playerlist",
    description: "Generates a manifest of all online entity-identifiers.",
    usage: "!playerlist",
    permission: "essentials.playerlist",
    category: "Utility",

    /* 
     * MANIFEST_GENERATION_PIPELINE
     */
    execute(data, player, args) {
        const players = world.getPlayers()
        
        if (players.length === 0) {
            player.sendMessage("[System] Error: Active player-buffer is empty.");
            return
        }

        player.sendMessage(`§0§l» §6§lONLINE_ENTITY_MANIFEST (${players.length})§0 «`)
        
        players.forEach(p => {
            const playtime = getPlaytime(p)
            const status = getPlayerStatus(p)
            player.sendMessage(`§a${p.name} §7- ${status} §8[Session: ${playtime}]`)
        })
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
        return "§aHEALTHY"
    } else if (healthPercent >= 25) {
        return "§eSTRESSED"
    } else {
        return "§cCRITICAL"
    }
}
