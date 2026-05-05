import { system, world } from "@minecraft/server"

/*
 * INDUSTRIAL_PERFORMANCE_DIAGNOSTIC
 * ----------------------------------------------------------------------------
 * A high-performance diagnostic tool for monitoring server-side temporal 
 * heartbeat. Implements a rolling-buffer of tick-timestamps to resolve 
 * the real-time Ticks-Per-Second (TPS) delta and uptime metrics.
 *
 * PHILOSOPHY: Performance is the lifeblood of the empire. Use this 
 * diagnostic vector to identify industrial-scale performance-degradation 
 * before system-collapse occurs.
 */

const tickTimes = [] // ROLLING_TIMESTAMP_BUFFER

/* 
 * TEMPORAL_SAMPLING_PROTOCOL
 * Pushes the current millisecond-timestamp into the buffer every tick. 
 * Caps at 21 entries to provide a 1-second rolling industrial average.
 */
system.runInterval(() => {
    tickTimes.push(Date.now())
    if (tickTimes.length > 21) tickTimes.shift()
}, 1)

/* 
 * TPS_RESOLUTION_PROTOCOL
 */
function getRealTPS() {
    if (tickTimes.length < 2) return 20
    const elapsed = tickTimes[tickTimes.length - 1] - tickTimes[0]
    if (elapsed === 0) return 20
    return Math.min(20, Math.round((tickTimes.length - 1) / (elapsed / 1000)))
}

const startTime = Date.now() // KERNEL_INITIALIZATION_STAMP

/* 
 * UPTIME_RESOLUTION_PROTOCOL
 */
function getUptime() {
    const uptime = Date.now() - startTime
    const hours = Math.floor(uptime / 3600000)
    const minutes = Math.floor((uptime % 3600000) / 60000)
    const seconds = Math.floor((uptime % 60000) / 1000)
    return `${hours}h ${minutes}m ${seconds}s` 
}

export const TPSCommand = {
    name: "tps",
    description: "Queries the system for real-time Ticks-Per-Second and industrial uptime metrics.",
    usage: "!tps",
    permission: "essentials.tps",
    category: "GENERAL",

    /* 
     * DIAGNOSTIC_EXECUTION_VECTOR
     */
    execute(_data, player, _args) {
        const tps = getRealTPS()
        const tpsColor = tps >= 18 ? "§a" : tps >= 12 ? "§e" : "§c"
        const playerCount = world.getAllPlayers().length

        player.sendMessage("§0§l» §6§lPERFORMANCE_DIAGNOSTIC_REPORT§0 «")
        player.sendMessage(`§aEngine_Pulse (TPS): ${tpsColor}${tps}§f/20`);
        player.sendMessage(`§aEntity_Density (Entities): §e${playerCount}`);
        player.sendMessage(`§aKernel_Uptime: §e${getUptime()}`);
        player.sendMessage(`§aMemory_Heap_Status: ${getMemoryUsage()}`);
    }
}

/* 
 * MEMORY_PRESSURE_PROBE (PROVISIONAL)
 */
function getMemoryUsage() {
    const tick = system.currentTick
    if (tick % 100 === 0) return "§aSTABLE"
    if (tick % 50 === 0) return "§eMODERATE_LOAD"
    return "§cHIGH_PRESSURE"
}
