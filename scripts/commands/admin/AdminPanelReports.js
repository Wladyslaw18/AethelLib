/**
 * Admin Panel Reports - Reports and logs sub-panel
 */

import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"

/** @typedef {import("@minecraft/server").Player} Player */

export async function showReports(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("§cNo permission.")
        return
    }
    const form = new ActionFormData()
        .title("§6§lReports & Logs")
        .body("Select a report or log category")
        .button("§aView Reports")
        .button("§bView Logs")
        .button("§cPlayer History")
        .button("§eEconomy Logs")
        .button("§fChat Logs")
        .button("§cBack")

    const res = await form.show(player)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            await showReportsList(player)
            break
        case 1:
            player.sendMessage("§7Logs interface coming soon...")
            await showReports(player)
            break
        case 2:
            await showPlayerHistory(player)
            break
        case 3:
            player.sendMessage("§7Economy logs interface coming soon...")
            await showReports(player)
            break
        case 4:
            player.sendMessage("§7Chat logs interface coming soon...")
            await showReports(player)
            break
        case 5:
            await showAdminPanel(player)
            break
    }
}

async function showReportsList(player) {
    const form = new ActionFormData()
        .title("§6§lPlayer Reports")
        .body("Select a report to view details")
        .button("§aNo active reports found")
        .button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === 1) {
        await showReports(player)
        return
    }

    if (res.selection === 0) {
        player.sendMessage("§7No active reports found")
        await showReports(player)
    }
}

async function showPlayerHistory(player) {
    const form = new ActionFormData()
        .title("§6§lPlayer History")
        .body("Select a player to view history")
        .button("§7No players online")
        .button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === 1) {
        await showReports(player)
        return
    }

    if (res.selection === 0) {
        player.sendMessage("§7Player history interface coming soon...")
        await showReports(player)
    }
}

