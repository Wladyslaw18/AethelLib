/**
 * Admin Panel Banned - Banned players sub-panel
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { UIUtils } from "../../ui/UIUtils.js"

export async function showBannedPlayers(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }

    const BanManager = Kernel.get("banManager")
    const bans = BanManager.getBans()
    
    const form = new Kernel.ActionFormData()
        .title("\u00A7a\u00A7e\u00A7l\u00A7c\u00A7lBanned Panel")
        .body(`\u00A7aTotal Players Banned : \u00A7f${bans.length}`)

    bans.forEach(ban => {
        form.button(`\u00A7c\u00A7l${ban.playerName}`, "textures/items/iron_axe")
    })

    form.button("\u00A7c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    if (res.selection === bans.length) {
        await showAdminPanel(player)
        return
    }

    const targetBan = bans[res.selection]
    await showBanInfoPanel(player, targetBan)
}

async function showBanInfoPanel(player, ban) {
    const expires = ban.expires === 0 ? "PERMANENT" : new Date(ban.expires).toLocaleString()
    
    const form = new Kernel.ActionFormData()
        .title(`\u00A7c\u00A7l${ban.playerName} Ban`)
        .body(`\u00A7aId : \u00A7f${ban.playerId}\n\u00A7aReason : \u00A7f${ban.reason}\n\u00A7aExpires : \u00A7f${expires}`)
        .button("\u00A7eUnban Player", "textures/items/totem")
        .button("\u00A7c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    if (res.selection === 0) {
        // Unban logic
        const WorldStore = Kernel.get("worldStore")
        const BanManager = Kernel.get("banManager")
        const bans = BanManager.getBans()
        const newBans = bans.filter(b => b.playerId !== ban.playerId)
        WorldStore.set("ae:bans", newBans)
        
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fSuccessfully unbanned \u00A7e${ban.playerName}\u00A7f.`)
        await showBannedPlayers(player)
    } else {
        await showBannedPlayers(player)
    }
}

