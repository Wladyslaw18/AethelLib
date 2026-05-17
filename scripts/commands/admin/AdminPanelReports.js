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
        player.sendMessage("\xA7cNo permission.")
        return
    }
    const form = new ActionFormData()
        .title("\xA76\xA7lReports & Logs")
        .body("Select a report or log category")
        .button("\xA7aView Reports")
        .button("\xA7bView Logs")
        .button("\xA7cPlayer History")
        .button("\xA7eEconomy Logs")
        .button("\xA7fChat Logs")
        .button("\xA7cBack")

    const res = await form.show(player)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            await showReportsList(player)
            break
        case 1:
            player.sendMessage("\xA77Logs interface coming soon...")
            await showReports(player)
            break
        case 2:
            await showPlayerHistory(player)
            break
        case 3:
            player.sendMessage("\xA77Economy logs interface coming soon...")
            await showReports(player)
            break
        case 4:
            player.sendMessage("\xA77Chat logs interface coming soon...")
            await showReports(player)
            break
        case 5:
            await showAdminPanel(player)
            break
    }
}

async function showReportsList(player) {
    const form = new ActionFormData()
        .title("\xA76\xA7lPlayer Reports")
        .body("Select a report to view details")
        .button("\xA7aNo active reports found")
        .button("\xA7cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === 1) {
        await showReports(player)
        return
    }

    if (res.selection === 0) {
        player.sendMessage("\xA77No active reports found")
        await showReports(player)
    }
}

async function showPlayerHistory(player) {
    const form = new ActionFormData()
        .title("\xA76\xA7lPlayer History")
        .body("Select a player to view history")
        .button("\xA77No players online")
        .button("\xA7cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === 1) {
        await showReports(player)
        return
    }

    if (res.selection === 0) {
        player.sendMessage("\xA77Player history interface coming soon...")
        await showReports(player)
    }
}

