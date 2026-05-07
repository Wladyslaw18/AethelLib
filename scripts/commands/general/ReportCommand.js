import { world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"
import { ReportStore } from "../../systems/general/ReportStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

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
        { name: "reason", type: "string", optional: true }
    ],

    /* 
     * REPORT_ENTRY_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:report <player|'server'> <reason>");
            player.sendMessage("§8- Example: /ae:report PlayerX cheating");
            player.sendMessage("§8- Example: /ae:report server lag issues");
            return
        }

        const reportType = args[0].toLowerCase()
        const message = args.slice(1).join(" ")

        if (reportType === "server") {
            createServerReport(player, message)
        } else {
            createPlayerReport(player, args[0], message) // Use raw arg for exact name lookup
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

    ReportStore.saveReport(report)
    notifyAdmins(report)
    
    player.sendMessage("§a§l» §fServer report submitted. The staff have been notified.");
}

/* 
 * PLAYER_INCIDENT_HANDLER
 * Performs a name-to-UUID resolution before committing the report 
 * to ensure target persistence across session changes.
 */
function createPlayerReport(player, targetName, message) {
    const target = PlayerUtils.findPlayer(targetName)

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

    ReportStore.saveReport(report)
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

