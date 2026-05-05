/**
 * Admin Report Command — !reports
 * Opens the admin report management UI
 */

import { Kernel } from "../../core/Kernel.js"

export const AdminReportCommand = {
    name: "reports",
    description: "View and manage player reports",
    usage: "!reports",
    permission: "essentials.admin.reports",
    category: "admin",

    async execute(data, player, args) {
        // Permission check via PermissionManager
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager.hasPermission(player, "essentials.admin.reports")) {
            player.sendMessage("§cYou do not have permission to view reports.")
            return
        }

        // Open report UI
        const { showAdminReportUI } = await import("../../ui/admin/AdminReportUI.js")
        await showAdminReportUI(player)
    }
}
