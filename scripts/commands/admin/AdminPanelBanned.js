/**
 * Admin Panel Banned - Banned players sub-panel
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { UIUtils } from "../../ui/UIUtils.js"

export async function showBannedPlayers(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\xA7cNo permission.")
        return
    }

    const BanManager = Kernel.get("banManager")
    const bans = BanManager.getBans()
    
    const form = new Kernel.ActionFormData()
        .title("\xA7a\xA7e\xA7l\xA7c\xA7lBanned Panel")
        .body(`\xA7aTotal Players Banned : \xA7f${bans.length}`)

    bans.forEach(ban => {
        form.button(`\xA7c\xA7l${ban.playerName}`, "textures/items/iron_axe")
    })

    form.button("\xA7c<= BACK", "textures/ui/refresh")

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
        .title(`\xA7c\xA7l${ban.playerName} Ban`)
        .body(`\xA7aId : \xA7f${ban.playerId}\n\xA7aReason : \xA7f${ban.reason}\n\xA7aExpires : \xA7f${expires}`)
        .button("\xA7eUnban Player", "textures/items/totem")
        .button("\xA7c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    if (res.selection === 0) {
        // Unban logic
        const WorldStore = Kernel.get("worldStore")
        const BanManager = Kernel.get("banManager")
        const bans = BanManager.getBans()
        const newBans = bans.filter(b => b.playerId !== ban.playerId)
        WorldStore.set("ae:bans", newBans)
        
        player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully unbanned \xA7e${ban.playerName}\xA7f.`)
        await showBannedPlayers(player)
    } else {
        await showBannedPlayers(player)
    }
}

