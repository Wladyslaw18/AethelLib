/**
 * Admin Panel Main - Root admin interface
 */

import { ActionFormData } from "@minecraft/server-ui"
import { showPlayerManagement } from "./AdminPanelPlayers.js"
import { showEconomyControl } from "./AdminPanelEconomy.js"
import { showServerSettings } from "./AdminPanelSettings.js"
import { showReports } from "./AdminPanelReports.js"

export const AdminPanelCommand = {
    name: "adminpanel",
    description: "Open admin control panel",
    usage: "/ae:adminpanel",
    permission: "essentials.admin",
    category: "admin",

    async execute(_data, player, _args) {
        await showAdminPanel(player)
    }
}

export async function showAdminPanel(player) {
    const form = new ActionFormData()
        .title("§6§lAdmin Panel")
        .body("Choose an admin action")
        .button("§aPlayer Management")
        .button("§bEconomy Control")
        .button("§cServer Settings")
        .button("§dWorld Management")
        .button("§eShop Control")
        .button("§fAuction House")
        .button("§6Reports & Logs")
        .button("§cClose")

    const res = await form.show(player)
    if (res.canceled || res.selection === 7) return

    switch (res.selection) {
        case 0:
            await showPlayerManagement(player)
            break
        case 1:
            await showEconomyControl(player)
            break
        case 2:
            await showServerSettings(player)
            break
        case 3:
            player.sendMessage("§7World management interface coming soon...")
            await showAdminPanel(player)
            break
        case 4:
            player.sendMessage("§7Shop control interface coming soon...")
            await showAdminPanel(player)
            break
        case 5:
            player.sendMessage("§7Auction control interface coming soon...")
            await showAdminPanel(player)
            break
        case 6:
            await showReports(player)
            break
    }
}

