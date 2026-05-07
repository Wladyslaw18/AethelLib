/**
 * Admin Panel Banned - Banned players sub-panel
 */

import { ActionFormData} from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { BanManager } from "../../systems/admin/BanManager.js"
import { UIUtils } from "../../ui/UIUtils.js"

export async function showBannedPlayers(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("§cNo permission.")
        return
    }

    const bans = BanManager.getBans()
    
    const form = new ActionFormData()
        .title("§a§e§l§c§lBanned Panel")
        .body(`§aTotal Players Banned : §f${bans.length}`)

    bans.forEach(ban => {
        form.button(`§c§l${ban.playerName}`, "textures/items/iron_axe")
    })

    form.button("§c<= BACK", "textures/ui/refresh")

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
    
    const form = new ActionFormData()
        .title(`§c§l${ban.playerName} Ban`)
        .body(`§aId : §f${ban.playerId}\n§aReason : §f${ban.reason}\n§aExpires : §f${expires}`)
        .button("§eUnban Player", "textures/items/totem")
        .button("§c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    if (res.selection === 0) {
        // Unban logic
        const WorldStore = Kernel.get("worldStore")
        const bans = BanManager.getBans()
        const newBans = bans.filter(b => b.playerId !== ban.playerId)
        WorldStore.set("ae:bans", newBans)
        
        player.sendMessage(`§a§l» §fSuccessfully unbanned §e${ban.playerName}§f.`)
        await showBannedPlayers(player)
    } else {
        await showBannedPlayers(player)
    }
}

