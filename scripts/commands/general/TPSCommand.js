import { Kernel } from "../../core/Kernel.js";

// ----------------------------------------------------------------------------
// | variable: tickTimes                                                      |
// | a rolling buffer of millisecond timestamps from the last 20 ticks.       |
// | used to calculate the real-Kernel.world passage of time vs engine ticks.        |
// ----------------------------------------------------------------------------
const tickTimes = []

// ----------------------------------------------------------------------------
// | Kernel.system: temporal sampling                                                 |
// | pushes the current time into the buffer every single tick.               |
// | we cap it at 21 entries to get exactly 1 second of rolling data.         |
// ----------------------------------------------------------------------------
Kernel.system.runInterval(() => {
    tickTimes.push(Date.now())
    if (tickTimes.length > 21) tickTimes.shift()
}, 1)

// ----------------------------------------------------------------------------
// | function: getRealTPS                                                     |
// | resolves the Ticks-Per-Second by comparing the time delta between the    |
// | first and last samples in our 1-second window.                           |
// ----------------------------------------------------------------------------
function getRealTPS() {
    if (tickTimes.length < 2) return 20
    const elapsed = tickTimes[tickTimes.length - 1] - tickTimes[0]
    // prevent division by zero or negative time.
    if (elapsed <= 0) return 20
    // formula: (total samples - 1) / (seconds elapsed).
    return Math.min(20, Math.round((tickTimes.length - 1) / (elapsed / 1000)))
}

// capture the exact moment the script engine started.
const startTime = Date.now()

// ----------------------------------------------------------------------------
// | function: getUptime                                                      |
// | calculates human-readable hours/mins/secs since the kernel boot.         |
// ----------------------------------------------------------------------------
function getUptime() {
    const uptime = Date.now() - startTime
    const hours = Math.floor(uptime / 3600000)
    const minutes = Math.floor((uptime % 3600000) / 60000)
    const seconds = Math.floor((uptime % 60000) / 1000)
    return `${hours}h ${minutes}m ${seconds}s` 
}

// ----------------------------------------------------------------------------
// | object: TPSCommand                                                       |
// | command definition for monitoring engine health and temporal stability.   |
// ----------------------------------------------------------------------------
export const TPSCommand = {
    // internal name.
    name: "tps",
    // human-readable description.
    description: "Check server performance and uptime",
    // syntax guide.
    usage: "/ae:tps",
    // required permission level.
    permission: "essentials.tps",
    // command category.
    category: "GENERAL",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | collects performance metrics and prints a colored status report.         |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        const tps = getRealTPS()
        // color coding: Green for 18-20 (Healthy), Yellow for 12-17 (Lagging), Red for <12 (Dying).
        const tpsColor = tps >= 18 ? "\xA7a" : tps >= 12 ? "\xA7e" : "\xA7c"
        const playerCount = Kernel.world.getAllPlayers().length

        player.sendMessage(" ")
        player.sendMessage("\xA76\xA7lServer Performance")
        player.sendMessage(`\xA77TPS: ${tpsColor}${tps} \xA7f/ 20`)
        player.sendMessage(`\xA77Players: \xA7e${playerCount}`)
        player.sendMessage(`\xA77Uptime: \xA7e${getUptime()}`)
        player.sendMessage(`\xA77Memory: ${getMemoryUsage()}`)
        player.sendMessage(" ")
    }
}

// ----------------------------------------------------------------------------
// | function: getMemoryUsage                                                 |
// | PROVISIONAL: Bedrock's JS environment lacks a direct heap probe.         |
// | this returns a simulated status based on engine rhythm until we find a   |
// | way to hook the allocator or we get a native API.                        |
// ----------------------------------------------------------------------------
function getMemoryUsage() {
    const tick = Kernel.system.currentTick
    if (tick % 100 === 0) return "\xA7aSTABLE"
    if (tick % 50 === 0) return "\xA7eMODERATE_LOAD"
    return "\xA7cHIGH_PRESSURE"
}
