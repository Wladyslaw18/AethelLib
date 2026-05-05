import { world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/*
 * INCIDENT_REPORTING_VECTOR
 * ----------------------------------------------------------------------------
 * Handles the collection and persistence of behavioral-incident reports. 
 * Supports both player-specific and global-server report types. 
 * Reports are serialized and committed to the 'ae:reports' registry 
 * with a priority-broadcast to authorized staff entities.
 *
 * PHILOSOPHY: Snitching is part of industrial health. If you see 
 * a structural failure or behavioral anomaly, report it.
 */
export const ReportCommand = {
    name: "report",
    description: "Orchestrates the submission of incident reports to the industrial staff.",
    usage: "!report <player_identifier|'server'> <content>",
    permission: "essentials.report",
    category: "Utility",

    /* 
     * REPORT_ENTRY_PIPELINE
     */
    execute(player, args) {
        if (args.length < 2) {
            player.sendMessage("[Manual] Syntax Error: Type and content required.");
            player.sendMessage("[Manual] Example: !report player_x behavior_anomaly");
            player.sendMessage("[Manual] Example: !report server spatial_lag_at_hub");
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
    
    player.sendMessage("[Success] Server incident report committed to registry. Staff notified.");
}

/* 
 * PLAYER_INCIDENT_HANDLER
 * Performs a name-to-UUID resolution before committing the report 
 * to ensure target persistence across session changes.
 */
function createPlayerReport(player, targetName, message) {
    const target = [...world.getPlayers()].find(p => 
        p.name.toLowerCase() === targetName.toLowerCase()
    )

    if (!target) {
        player.sendMessage(`[Error] Entity '${targetName}' not found or offline.`);
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
    
    player.sendMessage(`[Success] Incident report against '${target.name}' submitted.`);
}

/* 
 * UUID_GENERATION_VECTOR
 */
function generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/* 
 * REGISTRY_COMMIT_PROTOCOL
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
 * REGISTRY_QUERY_PROTOCOL
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
 * BROADCAST_NOTIFICATION_PROTOCOL
 * Scans the active player-buffer for entities with admin-level 
 * clearance and relays the incident report in real-time.
 */
function notifyAdmins(report) {
    const PermissionManager = Kernel.get("permissions")
    const reportType = report.type === "server" ? "§cSERVER_ISSUE" : `§ePLAYER_REPORT: §f${report.target}`
    const message = `§6[INCIDENT] ${reportType} §7FROM §e${report.reporter}§7: §f${report.message}`

    world.getPlayers().forEach(p => {
        if (PermissionManager.hasPermission(p, "essentials.admin.notify")) {
            p.sendMessage(message)
        }
    })
}
