import { Kernel } from "../../core/Kernel.js";
import { JournaledDb } from "../../core/datastore/JournaledDatabase.js";
import { PermissionCache } from "../../core/cache/CacheManager.js";


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
        const tpsColor = tps >= 18 ? "\u00A7a" : tps >= 12 ? "\u00A7e" : "\u00A7c"
        const playerCount = Kernel.world.getAllPlayers().length

        player.sendMessage(" ")
        player.sendMessage("\u00A76\u00A7lServer Performance")
        player.sendMessage(`\u00A77TPS: ${tpsColor}${tps} \u00A7f/ 20`)
        player.sendMessage(`\u00A77Players: \u00A7e${playerCount}`)
        player.sendMessage(`\u00A77Uptime: \u00A7e${getUptime()}`)
        player.sendMessage(`\u00A77Memory: ${getMemoryUsage()}`)
        player.sendMessage(" ")
    }
}

// ----------------------------------------------------------------------------
// | function: getMemoryUsage                                                 |
// | Scans the synthetic telemetry allocator for JournaledDb and CacheManager. |
// ----------------------------------------------------------------------------
function getMemoryUsage() {
    try {
        const dbBytes = JournaledDb.getMemoryFootprint();
        const cacheBytes = PermissionCache.getMemoryFootprint();
        const totalBytes = dbBytes + cacheBytes;
        
        const formatBytes = (bytes) => {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
            return `${(bytes / 1048576).toFixed(2)} MB`;
        };

        return `\u00A7a${formatBytes(totalBytes)} \u00A77(DB: \u00A7e${formatBytes(dbBytes)}\u00A77, Cache: \u00A7e${formatBytes(cacheBytes)}\u00A77)`;
    } catch (e) {
        return "\u00A7cERROR_ESTIMATING";
    }
}
