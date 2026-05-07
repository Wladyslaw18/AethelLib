import { world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/*
 * Report Command
 * ----------------------------------------------------------------------------
 * Allows players to report bugs or player misconduct to the staff.
 */

export const ReportCommand = {
    name: "report",
    description: "Report a player or a bug to the staff.",

    usage: "/ae:report <player_identifier|'server'> <content>",
    permission: "essentials.report",
    category: "Utility",
    parameters: [
        { name: "target", type: "player", optional: false },
        { name: "reason", type: "string", optional: false }
    ],

    /* 
     * REPORT_ENTRY_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:report <player|'server'> <reason>");
            player.sendMessage("§8- Example: /ae:report PlayerX for cheating");
            player.sendMessage("§8- Example: /ae:report server the hub is lagging");
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

/* 
 * SERVER_INCIDENT_HANDLER
 */
function createServerReport(player, message) {
    const report = {
        id: generateReportId(),
        type: "server",
        reporter: player.name,
        reporterId: player.id,
        message: message,
        timestamp: Date.now(),
        status: "OPEN"
    }

    saveReport(report)
    notifyAdmins(report)
    
    player.sendMessage("§a§l» §fServer report submitted. The staff have been notified.");

}

/* 
 * PLAYER_INCIDENT_HANDLER
 * Performs a name-to-UUID resolution before committing the report 
 * to ensure target persistence across session changes.
 */
function createPlayerReport(player, targetName, message) {
    const target = [...world.getAllPlayers()].find(p => 
        p.name.toLowerCase() === targetName.toLowerCase()
    )

    if (!target) {
        player.sendMessage(`§c§l» §7Player '${targetName}' not found or offline.`);
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
        status: "OPEN"
    }

    saveReport(report)
    notifyAdmins(report)
    
    player.sendMessage(`§a§l» §fReport against §e${target.name} §fsubmitted.`);

}

/* 
 * Generate a unique report ID
 */
function generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}


/* 
 * Save report to database
 */
function saveReport(report) {

    const reports = getReports()
    reports[report.id] = report
    
    try {
        world.setDynamicProperty("ae:reports", JSON.stringify(reports))
    } catch (error) {
        console.error(`[ReportCommand] PERSISTENCE_FAILURE: ${error}`)
    }
}

/* 
 * Get all reports from database
 */
function getReports() {

    try {
        const stored = world.getDynamicProperty("ae:reports")
        return (typeof stored === "string") ? JSON.parse(stored) : {}
    } catch (error) {
        console.error(`[ReportCommand] QUERY_FAILURE: ${error}`)
        return {}
    }
}

/* 
 * Notify online admins about the new report
 */
function notifyAdmins(report) {

    const PermissionManager = Kernel.get("permissions")
    const reportType = report.type === "server" ? "§c[SERVER ISSUE]" : `§e[PLAYER REPORT] §f${report.target}`
    const message = `§6§l» §e${reportType} §7from §f${report.reporter}§7: §f${report.message}`


    world.getAllPlayers().forEach(p => {
        if (PermissionManager.hasPermission(p, "essentials.admin.notify")) {
            p.sendMessage(message)
        }
    })
}
