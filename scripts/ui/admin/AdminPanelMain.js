/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  [ NOBLE INFRASTRUCTURE CORE  • 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Kernel } from "../../core/Kernel.js"
import { showPlayerManagement } from "./AdminPanelPlayers.js"
import { showServerSettings } from "./settings/AdminSettingsMenu.js"
import { showBannedPlayers } from "./AdminPanelBanned.js"
import { showEconomyControl } from "./AdminPanelEconomy.js"
import { showSystemToggles } from "./AdminPanelSystemToggles.js"
import { showAdminReportUI } from "./AdminReportUI.js"
import { UIUtils } from "../UIUtils.js"
import { getRealTPS } from "../../commands/general/TPSCommand.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"


export async function showAdminPanel(player) {
    const PermissionManager = Kernel.get("permissions");
    if (!PermissionManager || !PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("§cNo permission.");
        return;
    }

    const onlinePlayers = Kernel.world.getAllPlayers().length;
    const tps = getRealTPS();
    const currentTick = Kernel.system.currentTick ?? 0;
    const uptimeSeconds = Math.floor(currentTick / 20);
    const minutes = Math.floor(uptimeSeconds / 60);
    const seconds = uptimeSeconds % 60;
    const uptimeStr = `${minutes}m ${seconds}s`;

    // Count disabled systems for display
    const settings = SettingsStore.getAll();
    const systemKeys = [
        "moneySystem", "homeSystem", "tpaSystem", "warpSystem", "backSystem",
        "rtpSystem", "shopSystem", "sellSystem", "auctionSystem", "withdrawSystem",
        "messageSystem", "landSystem"
    ];
    let enabledCount = 0;
    for (const k of systemKeys) {
        if (settings[k] !== false) enabledCount++;
    }

    const res = await UIUtils.showForm(player, () => new Kernel.ActionFormData()
        .title("§6ADMIN §fCONTROL CENTER")
        .body(`§aUsername: §f${player.name}\n§aUptime: §f${uptimeStr}\n§aPlayers: §f${onlinePlayers}\n§aTPS: §f${tps}\n§aSystems: §f${enabledCount}/${systemKeys.length} active`)
        .button("§eSystem Toggles\n§7Enable/disable all subsystems", "textures/ui/world_glyph")
        .button("§6Economy Manager\n§7Manage server economy", "textures/items/emerald")
        .button("§aPlayer Management\n§7Kick, ban, mute, inspect", "textures/items/totem")
        .button("§cReports Queue\n§7Review player reports", "textures/items/iron_axe")
        .button("§bBanned Players\n§7View and manage bans", "textures/ui/cancel")
        .button("§6Rank Manager\n§7Modify permissions and roles", "textures/ui/op")
        .button("§6Global Settings\n§7Core config, gameplay, assets", "textures/items/comparator")
        .button("§7§l[BACK]", "textures/ui/refresh")
    );
    if (res.canceled || res.selection === 7) return;

    switch (res.selection) {
        case 0: await showSystemToggles(player); break;
        case 1: await showEconomyControl(player); break;
        case 2: await showPlayerManagement(player); break;
        case 3: await showAdminReportUI(player); break;
        case 4: await showBannedPlayers(player); break;
        case 5: {
            const { RankManagerMenu } = await import("../social/ranks/RankManagerMenu.js");
            await RankManagerMenu.showRankList(player, () => showAdminPanel(player));
            break;
        }
        case 6: await showServerSettings(player); break;
    }
}
