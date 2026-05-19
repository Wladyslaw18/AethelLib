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
    // native parameter definitions.
    parameters: [
        { name: "target", type: "player", optional: false },
        { name: "reason", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for report submission. routes the request to either a server  |
    // | bug handler or a player report handler based on the first token.         |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // syntax validation.
        if (args.length < 2) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:report <player|'server'> <reason>");
            player.sendMessage("\xA78- Example: /ae:report PlayerX cheating");
            player.sendMessage("\xA78- Example: /ae:report server lag issues");
            return
        }

        const reportType = args[0].toLowerCase()
        // join remaining tokens as the report description.
        const message = args.slice(1).join(" ")

        // branch based on target type.
        if (reportType === "server") {
            createServerReport(player, message)
        } else {
            // we use the raw targetName token and resolve it inside the handler.
            createPlayerReport(player, args[0], message) 
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
    
    player.sendMessage("\xA7a\xA7l» \xA7fServer report submitted. The staff have been notified.");
}

// ----------------------------------------------------------------------------
// | function: createPlayerReport                                             |
// | resolves the target player and builds a conduct report.                  |
// ----------------------------------------------------------------------------
function createPlayerReport(player, targetName, message) {
    // resolve the target entity. must be online for the initial report.
    const target = PlayerUtils.findPlayer(targetName)

    if (!target) {
        player.sendMessage(`\xA7c\xA7l» \xA77Player '${targetName}' not found or offline.`);
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
    
    player.sendMessage(`\xA7a\xA7l» \xA7fReport against \xA7e${target.name} \xA7fsubmitted.`);
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
    const reportType = report.type === "server" ? "\xA7c[SERVER ISSUE]" : `\xA7e[PLAYER REPORT] \xA7f${report.target}`
    const message = `\xA76\xA7l» \xA7e${reportType} \xA77from \xA7f${report.reporter}\xA77: \xA7f${report.message}`

    // iterate through all players and check permission nodes.
    Kernel.world.getAllPlayers().forEach(p => {
        if (PermissionManager.hasPermission(p, "essentials.admin.notify")) {
            p.sendMessage(message)
        }
    })
}
