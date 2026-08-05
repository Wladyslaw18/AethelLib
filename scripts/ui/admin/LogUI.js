import { Kernel } from "../../core/Kernel.js"
import { UIUtils } from "../UIUtils.js"
import { Lang } from "../Lang.js"

/**
 * Admin Log UI — Browse player activity logs
 */
export async function showLogBrowser(admin) {
    // Show all online players to pick from
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        const form = new Kernel.ActionFormData()
            .title(Lang.GRID_M + "\u00A76\u00A7lPlayer Logs")
            .body("\u00A7cNo players online.")
            .button("\u00A7cBack")
        const res = await UIUtils.showForm(admin, form)
        return
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_M + "\u00A76\u00A7lPlayer Logs")
        .body("Select a player to view activity logs")

    for (const p of players) {
        form.button(`\u00A7f${p.name}`, "textures/items/compass_item")
    }
    form.button("\u00A7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(admin, form)
    if (res.canceled || res.selection === players.length) return

    const target = players[res.selection]
    await showPlayerLogMenu(admin, target)
}

async function showPlayerLogMenu(admin, target) {
    const LogStore = Kernel.get("logStore")
    const summary = LogStore ? LogStore.getPlayerSummary(target.id) : { commandCount: 0, msgCount: 0 }

    let body = `\u00A77Player: \u00A7e${target.name}\n`
    body += `\u00A77Commands: \u00A7f${summary.commandCount}\n`
    body += `\u00A77Messages: \u00A7f${summary.msgCount}\n`
    if (summary.lastSeen) {
        const ago = Math.floor((Date.now() - summary.lastSeen) / 60000)
        body += `\u00A77Last activity: \u00A7f${ago}m ago\n`
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_M + `\u00A76\u00A7l${target.name}`)
        .body(body)
        .button("\u00A7bCommands", "textures/items/iron_sword")
        .button("\u00A7dPrivate Messages", "textures/items/paper")
        .button("\u00A7eAll Activity", "textures/items/compass_item")
        .button("\u00A7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(admin, form)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            await showLogEntries(admin, target, "command")
            break
        case 1:
            await showLogEntries(admin, target, "msg")
            break
        case 2:
            await showLogEntries(admin, target)
            break
        case 3:
            await showLogBrowser(admin)
            break
    }
}

async function showLogEntries(admin, target, category) {
    const LogStore = Kernel.get("logStore")
    const logs = LogStore ? LogStore.getPlayerLogs(target.id, category, 50) : []

    const categoryName = category === "command" ? "Commands" : category === "msg" ? "Messages" : "All Activity"

    if (logs.length === 0) {
        const form = new Kernel.ActionFormData()
            .title(Lang.GRID_M + `\u00A76\u00A7l${categoryName}`)
            .body(`\u00A77No ${categoryName.toLowerCase()} logged for \u00A7e${target.name}\u00A77.`)
            .button("\u00A7cBack")
        const res = await UIUtils.showForm(admin, form)
        await showPlayerLogMenu(admin, target)
        return
    }

    // Build a paginated display. Show entries in chat since UI forms have scroll limits.
    admin.sendMessage(`\u00A78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    admin.sendMessage(`\u00A76\u00A7l${categoryName}: \u00A7e${target.name}`);
    admin.sendMessage(`\u00A78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    let count = 0
    for (const log of logs) {
        if (count >= 30) {
            admin.sendMessage(`\u00A78... and ${logs.length - 30} more entries`);
            break
        }
        const time = new Date(log.timestamp).toLocaleTimeString()
        if (log.type === "command") {
            admin.sendMessage(`\u00A78[${time}] \u00A7b/ae:${log.command} \u00A77${log.args}`);
        } else if (log.type === "msg") {
            const dir = log.direction === "sent" ? "\u00A7d\u2192" : "\u00A75\u2190"
            admin.sendMessage(`\u00A78[${time}] ${dir} \u00A7e${log.partner}\u00A78: \u00A7f${log.content}`);
        }
        count++
    }
    admin.sendMessage(`\u00A78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Return to menu
    await showPlayerLogMenu(admin, target)
}
