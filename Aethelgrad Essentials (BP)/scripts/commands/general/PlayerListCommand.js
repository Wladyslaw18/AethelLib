/**
 * PlayerList Command - List online players with playtime
 */

import { world } from "@minecraft/server"

export const PlayerListCommand = {
    name: "playerlist",
    description: "List online players with playtime",
    usage: "!playerlist",
    permission: "essentials.playerlist",
    category: "utility",

    execute(data, player, args) {
        const players = world.getPlayers()
        
        if (players.length === 0) {
            player.sendMessage("§cNo players are currently online")
            return
        }

        player.sendMessage(`§6=== Online Players (${players.length}) ===`)
        
        players.forEach(p => {
            const playtime = getPlaytime(p)
            const status = getPlayerStatus(p)
            player.sendMessage(`§a${p.name} §7- ${status} §8[${playtime}]`)
        })
    }
}

function getPlaytime(player) {
    // Get playtime from player dynamic property
    const joinTime = player.getDynamicProperty("joinTime")
    if (!joinTime) return "Unknown"
    
    const playtimeMs = Date.now() - joinTime
    const hours = Math.floor(playtimeMs / (1000 * 60 * 60))
    const minutes = Math.floor((playtimeMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}

function getPlayerStatus(player) {
    const health = player.getComponent("health")
    const currentHealth = health?.current || 0
    const maxHealth = health?.value || 20
    
    const healthPercent = (currentHealth / maxHealth) * 100
    
    if (healthPercent >= 75) {
        return "§aHealthy"
    } else if (healthPercent >= 25) {
        return "§eHurt"
    } else {
        return "§cCritical"
    }
}
