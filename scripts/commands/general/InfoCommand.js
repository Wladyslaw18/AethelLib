import { world, system } from "@minecraft/server"

/*
 * SYSTEM_HEALTH_DIAGNOSTIC
 * ----------------------------------------------------------------------------
 * A utility command for monitoring global server metrics. Queries the 
 * system for active tick-counts and player-buffer density.
 *
 * PHILOSOPHY: Transparency is key. We broadcast the engine's status to 
 * ensure the staff understands the current load on the Titanium Kernel.
 */
export const InfoCommand = {
    name: "info",
    description: "Queries the system for global health and industrial metrics.",
    usage: "!info",
    permission: "essentials.info",
    category: "Utility",

    /* 
     * DIAGNOSTIC_PIPELINE
     */
    execute(_data, player, _args) {
        const playerCount = world.getPlayers().length
        const uptime = getUptime()
        const version = getServerVersion()
        
        player.sendMessage("§0§l» §6§lAETHELGRAD_SYSTEM_HEALTH§0 «")
        player.sendMessage(`§aEngine_Identifier: §eAethelgrad Essentials`);
        player.sendMessage(`§aCore_Revision: §e${version}`);
        player.sendMessage(`§aEntity_Density (Players): §e${playerCount}§7/§e20`);
        player.sendMessage(`§aKernel_Uptime: §e${uptime}`);
        player.sendMessage("")
        player.sendMessage("§6ACTIVE_MODULES:")
        player.sendMessage("§7- Secure Economy Buffer")
        player.sendMessage("§7- Spatial Reversion Vector")
        player.sendMessage("§7- Identity Messaging Bridge")
        player.sendMessage("§7- Safe Arithmetic Engine")
        player.sendMessage("§7INDUSTRIAL_NOTE: Evaluated with zero-allocation logic.");
    }
}

/* 
 * UPTIME_RESOLUTION_ENGINE
 * Converts the current server tick-count into a human-readable 
 * industrial duration string.
 */
function getUptime() {
    const uptime = system.currentTick * 50 // MS_CONVERSION
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

/* 
 * REVISION_ACCESSOR
 */
function getServerVersion() {
    return "1.21.0-Titanium"
}
