/**
 * Admin Panel Main - Root admin interface
 */

import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showPlayerManagement } from "./AdminPanelPlayers.js"
import { showServerSettings } from "./AdminPanelSettings.js"
import { showBannedPlayers } from "./AdminPanelBanned.js"

import { UIUtils } from "../../ui/UIUtils.js"

export const AdminPanelCommand = {
    name: "adminpanel",
    aliases: ["ap", "admin", "panel"],
    description: "Open admin control panel",
    usage: "/ae:adminpanel",
    permission: "essentials.admin",
    category: "admin",

    async execute(_data, player, _args) {
        await showAdminPanel(player)
    }
}

export async function showAdminPanel(player) {
    const onlinePlayers = Kernel.world.getAllPlayers().length
    const tps = 20 // Fixed for now
    const uptimeSeconds = Math.floor(Kernel.system.currentTick / 20)
    
    const minutes = Math.floor(uptimeSeconds / 60)
    const seconds = uptimeSeconds % 60
    const uptimeStr = `${minutes} minutes, ${seconds} seconds`

    const form = new ActionFormData()
        .title("§a§e§m§e§lAdmin Panel")
        .body(`§aUsername : §f${player.name}\n§aServer Online : §f${uptimeStr}\n§aPlayers Online : §f${onlinePlayers}\n§aTPS : §f${tps}`)
        .button("§aPlayers", "textures/items/totem")
        .button("§0Settings", "textures/ui/settings_glyph_complex")
        .button("§cBanned Players", "textures/items/iron_axe")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            await showPlayerManagement(player)
            break
        case 1:
            await showServerSettings(player)
            break
        case 2:
            await showBannedPlayers(player)
            break
    }
}
