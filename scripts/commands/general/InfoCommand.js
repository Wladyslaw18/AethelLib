import { world, system } from "@minecraft/server"

/*
 * Info Command
 * ----------------------------------------------------------------------------
 * Displays server information and active system status.
 */

export const InfoCommand = {
    name: "info",
    description: "View server information and status",

    usage: "/ae:info",
    permission: "essentials.info",
    category: "Utility",

    execute(_data, player, _args) {
        const playerCount = world.getAllPlayers().length
        const uptime = getUptime()
        const version = getServerVersion()
        
        player.sendMessage(" ")
        player.sendMessage("§f§lAETHELGRAD §r§7| §6§lSERVER INFO")
        player.sendMessage("§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        player.sendMessage(`§7» §fVersion:    §b${version}`)
        player.sendMessage(`§7» §fUptime:     §d${uptime}`)
        player.sendMessage(`§7» §fPlayers:    §3${playerCount}§8/§320`)
        player.sendMessage(`§7» §fCore:       §aAethelLib`)
        player.sendMessage("§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

        player.sendMessage("§6§l[ SYSTEMS ]")
        player.sendMessage("§7• §fEconomy System §8(Active)")
        player.sendMessage("§7• §fTeleport System §8(Active)")
        player.sendMessage("§7• §fSocial System §8(Active)")
        player.sendMessage("§7• §fUtility System §8(Active)")
        player.sendMessage("§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        player.sendMessage(" ")
    }

}

function getUptime() {
    const uptime = system.currentTick * 50
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

function getServerVersion() {
    return "1.26.20"
}
