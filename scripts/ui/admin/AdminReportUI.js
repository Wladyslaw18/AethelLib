/**
 * Admin Report UI — Full report management GUI
 * List, detail view, delete, ban, teleport
 */

import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { ReportStore } from "../../systems/general/ReportStore.js"
import { UIUtils } from "../UIUtils.js"

/**
 * Show report management list
 * @param {import("@minecraft/server").Player} admin
 */
export async function showAdminReportUI(admin) {
    const reports = ReportStore.getReports()

    const reportEntries = Object.entries(reports)
        .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))

    const form = new ActionFormData()
        .title("\xA7c\xA7l📋 Report Manager")
        .body(reportEntries.length > 0
            ? `\xA77${reportEntries.length} report(s)`
            : "\xA7aNo open reports! 🎉")

    // Back button
    form.button("\xA7c← Back", "textures/ui/refresh")

    // Report buttons
    for (const [_id, report] of reportEntries) {
        const timeAgo = getTimeAgo(report.timestamp)
        const typeColor = report.type === "server" ? "\xA7c" : "\xA7e"
        const typeLabel = report.type === "server" ? "SERVER" : "PLAYER"
        const targetLabel = report.target ? ` → ${report.target}` : ""
        form.button(`${typeColor}[${typeLabel}] \xA7f${report.reporter}${targetLabel}\n\xA78${timeAgo}`)
    }

    const response = await UIUtils.showForm(admin, form)
    if (response.canceled) return

    if (response.selection === 0) return // Back

    const selectedIndex = response.selection - 1
    const [reportId, reportData] = reportEntries[selectedIndex]
    if (!reportId) return

    await showReportDetail(admin, reportId, reportData)
}

/**
 * Show detailed report view with action buttons
 * @param {import("@minecraft/server").Player} admin
 * @param {string} reportId
 * @param {Object} report
 */
async function showReportDetail(admin, reportId, report) {
    const timeAgo = getTimeAgo(report.timestamp)
    const typeLabel = report.type === "server" ? "\xA7cServer Issue" : "\xA7ePlayer Report"

    let body = `\xA76Type: ${typeLabel}\n`
    body += `\xA77Reporter: \xA7f${report.reporter}\n`
    if (report.target) body += `\xA77Target: \xA7c${report.target}\n`
    body += `\xA77Time: \xA7f${timeAgo}\n`
    body += `\xA77Status: \xA7f${report.status || "open"}\n`
    body += `\xA7r\n\xA77Message:\n\xA7f${report.message}`

    const form = new ActionFormData()
        .title("\xA7c\xA7lReport Detail")
        .body(body)
        .button("\xA7c🗑️ Delete Report", "textures/ui/cancel")
        .button("\xA74🔨 Ban Target", "textures/items/iron_axe")
        .button("\xA77← Back to Reports", "textures/ui/refresh")

    const response = await UIUtils.showForm(admin, form)
    if (response.canceled) return

    switch (response.selection) {
        case 0: {
            // Delete report
            ReportStore.deleteReport(reportId)
            admin.sendMessage(`\xA7aReport \xA7e${reportId.slice(0, 8)}... \xA7adeleted.`)
            Kernel.system.run(() => showAdminReportUI(admin))
            break
        }
        case 1: {
            // Ban target
            if (!report.target) {
                admin.sendMessage("\xA7cNo target player to ban (this is a server report).")
                Kernel.system.run(() => showReportDetail(admin, reportId, report))
                return
            }

            const target = Kernel.world.getAllPlayers().find(p => p.name === report.target)
            if (!target) {
                admin.sendMessage(`\xA7cPlayer '${report.target}' is not online.`)
                Kernel.system.run(() => showReportDetail(admin, reportId, report))
                return
            }

            // Execute ban
            Kernel.system.run(() => {
                try {
                    const BanManager = Kernel.get("admin")
                    if (BanManager && BanManager.banPlayer) {
                        BanManager.banPlayer(target, admin, `Report: ${report.message}`)
                        admin.sendMessage(`\xA7a${report.target} has been banned.`)
                    } else {
                        admin.sendMessage("\xA7cBan system unavailable.")
                    }
                } catch (error) {
                    admin.sendMessage(`\xA7cFailed to ban: ${error}`)
                }
            })

            // Auto-delete the report after ban
            ReportStore.deleteReport(reportId)
            break
        }
        case 2: {
            // Back
            Kernel.system.run(() => showAdminReportUI(admin))
            break
        }
    }
}

/**
 * Get human-readable time difference
 * @param {number} timestamp
 * @returns {string}
 */
function getTimeAgo(timestamp) {
    if (!timestamp) return "Unknown"
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}
