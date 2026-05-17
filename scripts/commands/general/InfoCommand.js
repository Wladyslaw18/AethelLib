import { world, system } from "@minecraft/server"

// ----------------------------------------------------------------------------
// | object: InfoCommand                                                      |
// | command definition for displaying server health and versioning metadata.  |
// | provides a high-level overview of active sub-systems.                    |
// ----------------------------------------------------------------------------
export const InfoCommand = {
    // internal name.
    name: "info",
    // human-readable description.
    description: "View server information and status",
    // syntax guide.
    usage: "/ae:info",
    // required permission node.
    permission: "essentials.info",
    // command category.
    category: "Utility",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | collects real-time metrics (player counts, uptime) and formats them into |
    // | a branded information card.                                              |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // query the native engine for current player count.
        const playerCount = world.getAllPlayers().length
        // resolve human-readable uptime from the internal tick counter.
        const uptime = getUptime()
        // hardcoded version identifier (needs manual update per release).
        const version = getServerVersion()
        
        // aesthetic output.
        player.sendMessage(" ")
        player.sendMessage("\xA7f\xA7lAETHELGRAD \xA7r\xA77| \xA76\xA7lSERVER INFO")
        player.sendMessage("\xA78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        player.sendMessage(`\xA77» \xA7fVersion:    \xA7b${version}`)
        player.sendMessage(`\xA77» \xA7fUptime:     \xA7d${uptime}`)
        player.sendMessage(`\xA77» \xA7fPlayers:    \xA73${playerCount}\xA78/\xA7320`)
        player.sendMessage(`\xA77» \xA7fCore:       \xA7aAethelLib`)
        player.sendMessage("\xA78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

        // status checklist for major engine modules.
        // currently these are static indicators as these systems are kernel-critical.
        player.sendMessage("\xA76\xA7l[ SYSTEMS ]")
        player.sendMessage("\xA77• \xA7fEconomy System \xA78(Active)")
        player.sendMessage("\xA77• \xA7fTeleport System \xA78(Active)")
        player.sendMessage("\xA77• \xA7fSocial System \xA78(Active)")
        player.sendMessage("\xA77• \xA7fUtility System \xA78(Active)")
        player.sendMessage("\xA78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        player.sendMessage(" ")
    }
}

// ----------------------------------------------------------------------------
// | function: getUptime                                                      |
// | converts the current engine tick count into a formatted temporal string.  |
// | assumes 20 ticks per second (50ms delta).                                |
// ----------------------------------------------------------------------------
function getUptime() {
    // calculate total milliseconds.
    const uptime = system.currentTick * 50
    // break down into days, hours, and minutes.
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    
    // return the most significant units.
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}

// ----------------------------------------------------------------------------
// | function: getServerVersion                                               |
// | returns the hardcoded release string for the current deployment.          |
// ----------------------------------------------------------------------------
function getServerVersion() {
    return "1.26.20"
}
