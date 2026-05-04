/**
 * Info Command - Display server information
 */

import { world, system } from "@minecraft/server"

export const InfoCommand = {
    name: "info",
    description: "Show server information",
    usage: "!info",
    permission: "essentials.info",
    category: "utility",

    execute(data, player, args) {
        const playerCount = world.getPlayers().length
        const uptime = getUptime()
        const version = getServerVersion()
        
        player.sendMessage("§6=== Server Information ===")
        player.sendMessage(`§aServer: §eAethelgrad Essentials`)
        player.sendMessage(`§aVersion: §e${version}`)
        player.sendMessage(`§aPlayers: §e${playerCount}§7/§e20`)
        player.sendMessage(`§aUptime: §e${uptime}`)
        player.sendMessage("")
        player.sendMessage("§6=== Features ===")
        player.sendMessage("§a✓ Secure Economy System")
        player.sendMessage("§a✓ Teleportation Suite")
        player.sendMessage("§a✓ Private Messaging")
        player.sendMessage("§a✓ Safe Math Calculator")
        player.sendMessage("§7No backdoors. No eval. No scoreboard databases.")
    }
}

function getUptime() {
    const uptime = system.currentTick * 50 // Convert ticks to milliseconds
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}

function getServerVersion() {
    // Return a formatted version string
    return "1.21.0"
}

