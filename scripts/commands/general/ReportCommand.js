/**
 * Report Command - Report players or server issues
 */

import { world } from "@minecraft/server"

export const ReportCommand = {
    name: "report",
    description: "Report a player or server issue",
    usage: "!report <player|server> <message>",
    permission: "essentials.report",
    category: "utility",

    execute(data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§cUsage: !report <player|server> <message>")
            player.sendMessage("§7Example: !report player griefing diamonds")
            player.sendMessage("§7Example: !report server lag at spawn")
            return
        }

        const reportType = args[0].toLowerCase()
        const message = args.slice(1).join(" ")

        if (reportType === "server") {
            createServerReport(player, message)
        } else {
            createPlayerReport(player, reportType, message)
        }
    }
}

function createServerReport(player, message) {
    const report = {
        id: generateReportId(),
        type: "server",
        reporter: player.name,
        reporterId: player.id,
        message: message,
        timestamp: Date.now(),
        status: "open"
    }

    saveReport(report)
    notifyAdmins(report)
    
    player.sendMessage("§aYour server report has been submitted. Admins have been notified.")
}

function createPlayerReport(player, targetName, message) {
    // Find target player
    const target = [...world.getPlayers()].find(p => 
        p.name.toLowerCase() === targetName.toLowerCase()
    )

    if (!target) {
        player.sendMessage(`§cPlayer '§e${targetName}§c' not found or not online`)
        return
    }

    const report = {
        id: generateReportId(),
        type: "player",
        target: target.name,
        targetId: target.id,
        reporter: player.name,
        reporterId: player.id,
        message: message,
        timestamp: Date.now(),
        status: "open"
    }

    saveReport(report)
    notifyAdmins(report)
    
    player.sendMessage(`§aYour report against §e${target.name}§a has been submitted.`)
}

function generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function saveReport(report) {
    // Store report in world dynamic properties
    const reports = getReports()
    reports[report.id] = report
    
    try {
        world.setDynamicProperty("ae:reports", JSON.stringify(reports))
    } catch (error) {
        console.error(`Failed to save report: ${error}`)
    }
}

function getReports() {
    try {
        const stored = world.getDynamicProperty("ae:reports")
        return stored ? JSON.parse(stored) : {}
    } catch (error) {
        console.error(`Failed to load reports: ${error}`)
        return {}
    }
}

function notifyAdmins(report) {
    const admins = world.getPlayers().filter(player => 
        player.hasTag("admin") || player.hasTag("moderator")
    )

    const reportType = report.type === "server" ? "§cServer Issue" : `§ePlayer Report: §f${report.target}`
    const message = `§6[REPORT] ${reportType} §7from §e${report.reporter}§7: §f${report.message}`

    admins.forEach(admin => {
        try {
            admin.sendMessage(message)
        } catch (error) {
            console.error(`Failed to notify admin ${admin.name}: ${error}`)
        }
    })
}

