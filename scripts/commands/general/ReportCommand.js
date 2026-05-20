import { Kernel } from "../../core/Kernel.js"
import { ReportStore } from "../../systems/general/ReportStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: ReportCommand                                                    |
// | command definition for the centralized incident reporting vector.         |
// | supports both server-wide issues (bugs) and player misconduct reports.    |
// ----------------------------------------------------------------------------
export const ReportCommand = {
    // internal identifier.
    name: "report",
    // human-readable description.
    description: "Report a player or a bug to the staff.",
    // syntax guide.
    usage: "/ae:report <player_identifier|'server'> <content>",
    // required permission node.
    permission: "essentials.report",
    // command category.
    category: "Utility",
    // Intercepted by script for complex string handling.
    native: false,
    // native parameter definitions.
    parameters: [
        { name: "target", type: "string", optional: false },
        { name: "reason", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for report submission. routes the request to either a server  |
    // | bug handler or a player report handler based on the first token.         |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        if (args.length < 1) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:report <player|'server'> <reason>");
            return
        }

        const reportType = args[0].toLowerCase()
        
        if (reportType === "server") {
            const message = args.slice(1).join(" ")
            if (!message) {
                player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:report server <reason>");
                return
            }
            createServerReport(player, message)
        } else {
            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)
            const message = args.slice(consumedArgs).join(" ")
            
            if (!target || !message) {
                player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:report <player> <reason>");
                return
            }
            createPlayerReport(player, target.name, message) 
        }
    }
}

// ----------------------------------------------------------------------------
// | function: createServerReport                                             |
// | packages a bug report and commits it to the persistent store.            |
// ----------------------------------------------------------------------------
function createServerReport(player, message) {
    const report = {
        // generate a unique temporal identifier.
        id: generateReportId(),
        type: "server",
        reporter: player.name,
        reporterId: player.id,
        message: message,
        timestamp: Date.now(),
        status: "OPEN"
    }

    // persist to the database.
    ReportStore.saveReport(report)
    // alert online staff members immediately.
    notifyAdmins(report)
    
    player.sendMessage("\u00A7a\u00A7l» \u00A7fServer report submitted. The staff have been notified.");
}

// ----------------------------------------------------------------------------
// | function: createPlayerReport                                             |
// | resolves the target player and builds a conduct report.                  |
// ----------------------------------------------------------------------------
function createPlayerReport(player, targetName, message) {
    // resolve the target entity. must be online for the initial report.
    const target = PlayerUtils.findPlayer(targetName)

    if (!target) {
        player.sendMessage(`\u00A7c\u00A7l» \u00A77Player '${targetName}' not found or offline.`);
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

    // commit and notify.
    ReportStore.saveReport(report)
    notifyAdmins(report)
    
    player.sendMessage(`\u00A7a\u00A7l» \u00A7fReport against \u00A7e${target.name} \u00A7fsubmitted.`);
}

// ----------------------------------------------------------------------------
// | function: generateReportId                                               |
// | builds a collision-resistant unique ID string for database indexing.     |
// ----------------------------------------------------------------------------
function generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ----------------------------------------------------------------------------
// | function: notifyAdmins                                                   |
// | broadcasts the report metadata to all online players with staff perms.   |
// ----------------------------------------------------------------------------
function notifyAdmins(report) {
    const PermissionManager = Kernel.get("permissions")
    // format a pretty header based on the report type.
    const reportType = report.type === "server" ? "\u00A7c[SERVER ISSUE]" : `\u00A7e[PLAYER REPORT] \u00A7f${report.target}`
    const message = `\u00A76\u00A7l» \u00A7e${reportType} \u00A77from \u00A7f${report.reporter}\u00A77: \u00A7f${report.message}`

    // iterate through all players and check permission nodes.
    Kernel.world.getAllPlayers().forEach(p => {
        if (PermissionManager.hasPermission(p, "essentials.admin.notify")) {
            p.sendMessage(message)
        }
    })
}
