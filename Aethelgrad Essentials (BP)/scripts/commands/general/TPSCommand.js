/**
 * TPS Command - Show server ticks per second
 */
import { system, world } from "@minecraft/server"

const tickTimes = []

system.runInterval(() => {
    tickTimes.push(Date.now())
    if (tickTimes.length > 21) tickTimes.shift()
}, 1)

function getRealTPS() {
    if (tickTimes.length < 2) return 20
    const elapsed = tickTimes[tickTimes.length - 1] - tickTimes[0]
    if (elapsed === 0) return 20
    return Math.min(20, Math.round((tickTimes.length - 1) / (elapsed / 1000)))
}

const startTime = Date.now()

function getUptime() {
    const uptime = Date.now() - startTime
    const hours = Math.floor(uptime / 3600000)
    const minutes = Math.floor((uptime % 3600000) / 60000)
    const seconds = Math.floor((uptime % 60000) / 1000)
    return `${hours}h ${minutes}m ${seconds}s` 
}

export const TPSCommand = {
    name: "tps",
    description: "Show server ticks per second",
    usage: "!tps",
    permission: "essentials.tps",
    category: "utility",

    execute(_data, player, _args) {
        const tps = getRealTPS()
        const tpsColor = tps >= 18 ? "§a" : tps >= 12 ? "§e" : "§c"
        const playerCount = world.getPlayers().length

        player.sendMessage("§6=== Server Performance ===")
        player.sendMessage(`§aTPS: ${tpsColor}${tps}§f/20`)
        player.sendMessage(`§aPlayers: §e${playerCount}`)
        player.sendMessage(`§aUptime: §e${getUptime()}`)
    }
}

function getMemoryUsage() {
    // Simplified memory indicator
    // In a real implementation, you'd use proper memory monitoring
    const tick = system.currentTick
    if (tick % 100 === 0) {
        return "§aNormal"
    } else if (tick % 50 === 0) {
        return "§eMedium"
    } else {
        return "§cHigh"
    }
}
