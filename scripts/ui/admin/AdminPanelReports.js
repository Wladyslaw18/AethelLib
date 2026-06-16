/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *  
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.
 *  
 *  [ NOBLE INFRASTRUCTURE CORE  • 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Admin Panel Reports - Reports and logs sub-panel
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { UIUtils } from "../UIUtils.js"
import { Lang } from "../Lang.js"

/** @typedef {import("@minecraft/server").Player} Player */

export async function showReports(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }
    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_M + "\u00A76\u00A7lReports & Logs")
        .body("Select a report or log category")
        .button("\u00A7aView Reports")
        .button("\u00A7bView Logs")
        .button("\u00A7cPlayer History")
        .button("\u00A7eEconomy Logs")
        .button("\u00A7fChat Logs")
        .button("\u00A7cBack")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            await showReportsList(player)
            break
        case 1:
            player.sendMessage("\u00A77Logs interface coming soon...")
            await showReports(player)
            break
        case 2:
            await showPlayerHistory(player)
            break
        case 3:
            player.sendMessage("\u00A77Economy logs interface coming soon...")
            await showReports(player)
            break
        case 4:
            player.sendMessage("\u00A77Chat logs interface coming soon...")
            await showReports(player)
            break
        case 5:
            await showAdminPanel(player)
            break
    }
}

async function showReportsList(player) {
    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_M + "\u00A76\u00A7lPlayer Reports")
        .body("Select a report to view details")
        .button("\u00A7aNo active reports found")
        .button("\u00A7cBack")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === 1) {
        await showReports(player)
        return
    }

    if (res.selection === 0) {
        player.sendMessage("\u00A77No active reports found")
        await showReports(player)
    }
}

async function showPlayerHistory(player) {
    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_M + "\u00A76\u00A7lPlayer History")
        .body("Select a player to view history")
        .button("\u00A77No players online")
        .button("\u00A7cBack")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === 1) {
        await showReports(player)
        return
    }

    if (res.selection === 0) {
        player.sendMessage("\u00A77Player history interface coming soon...")
        await showReports(player)
    }
}