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
 *  [ NOBLE INFRASTRUCTURE CORE ]
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Admin Panel Settings - Global category-based system configuration
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"
import { UIUtils } from "../UIUtils.js"
import { RankUI } from "../social/ranks/RankUI.js"
import { Lang } from "../Lang.js"

export async function showServerSettings(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager || !PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_M + "\u00A76\u00A7lSYSTEM SETTINGS")
        .body("\u00A77Select a configuration category to modify global server variables.")
        .button("\u00A7eCore Configuration\n\u00A78Money bounds, prefixes, text info", "textures/items/book_writable")
        .button("\u00A7aSystem Modules\n\u00A78Toggle core mechanics and subsystems", "textures/items/comparator")
        .button("\u00A7bGameplay & Features\n\u00A78PVP, cooldowns, display options", "textures/items/diamond_sword")
        .button("\u00A7dAsset Manifests\n\u00A78Banned items and hostile mobs", "textures/items/paper")
        .button("\u00A7dAuthority \u0026 Limits\n\u00A78Admin tags, default ranks, bounds", "textures/items/shield")
        .button("\u00A7cRank Permissions\n\u00A78In-game rank permission editor", "textures/ui/op")
        .button("\u00A7cBACK", "textures/ui/refresh");

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    const settings = SettingsStore.getAll()
    const back = () => {
        Kernel.system.runTimeout(() => {
            showServerSettings(player).catch(e => console.error(e));
        }, 5);
    }

    switch (res.selection) {
        case 0:
            await showCoreSettings(player, settings, back)
            break
        case 1:
            await showSystemModules(player, settings, back)
            break
        case 2:
            await showGameplayFeatures(player, settings, back)
            break
        case 3:
            await showAssetManifests(player, settings, back)
            break
        case 4:
            await showAuthorityLimits(player, settings, back)
            break
        case 5:
            await RankUI.showRankList(player, back)
            break
        case 6:
            await showAdminPanel(player)
            break
    }
}

async function showCoreSettings(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GRID_M + "\u00A7e\u00A7lCore Configuration")
        .textField("Starter Money (credits assigned on first spawn):", "1000", String(settings.starterMoney || "1000"))
        .textField("Max Money Cap (safe liquidity ceiling):", "1e+32", String(settings.maxMoney || "1e+32"))
        .textField("Command Prefix (triggers chat commands):", "-", String(settings.commandPrefix || "-"))
        .textField("Currency Symbol/Prefix (displayed on screens):", "$", String(settings.currencyPrefix || "$"))
        .textField("Server Info Details (used in help descriptions):", "Made by Wladyslaw", String(settings.serverInfo || ""))
        .textField("Welcome/Join Message (sent when players join):", "Welcome!", String(settings.joinMessage || ""));

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.runTimeout(backCallback, 5);
        return;
    }

    settings.starterMoney = res.formValues[0]
    settings.maxMoney = res.formValues[1]
    settings.commandPrefix = res.formValues[2]
    settings.currencyPrefix = res.formValues[3]
    settings.serverInfo = res.formValues[4]
    settings.joinMessage = res.formValues[5]

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fCore configuration saved successfully.")
    Kernel.system.runTimeout(backCallback, 5);
}

async function showSystemModules(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GRID_M + "\u00A7a\u00A7lSystem Modules")
        .toggle("Enable Economy System", !!settings.moneySystem)
        .toggle("Enable Home System", !!settings.homeSystem)
        .toggle("Enable TPA System", !!settings.tpaSystem)
        .toggle("Enable Warp System", !!settings.warpSystem)
        .toggle("Enable Back Navigation Command", !!settings.backSystem)
        .toggle("Enable Random Teleport (RTP)", !!settings.rtpSystem)
        .toggle("Enable Chest Shop System", !!settings.shopSystem)
        .toggle("Enable Quick Sell Mechanic", !!settings.sellSystem)
        .toggle("Enable Auction House System", !!settings.auctionSystem)
        .toggle("Enable Banknote Withdrawal System", !!settings.withdrawSystem)
        .toggle("Enable Private Message/Reply System", !!settings.messageSystem)
        .toggle("Enable Land Claims Subsystem", !!settings.landSystem);

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.runTimeout(backCallback, 5);
        return;
    }

    settings.moneySystem = res.formValues[0]
    settings.homeSystem = res.formValues[1]
    settings.tpaSystem = res.formValues[2]
    settings.warpSystem = res.formValues[3]
    settings.backSystem = res.formValues[4]
    settings.rtpSystem = res.formValues[5]
    settings.shopSystem = res.formValues[6]
    settings.sellSystem = res.formValues[7]
    settings.auctionSystem = res.formValues[8]
    settings.withdrawSystem = res.formValues[9]
    settings.messageSystem = res.formValues[10]
    settings.landSystem = res.formValues[11]

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fSystem modules updated successfully.")
    Kernel.system.runTimeout(backCallback, 5);
}

async function showGameplayFeatures(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GRID_M + "\u00A7b\u00A7lGameplay & Features")
        .toggle("Combat Teleport Block (pvp tag prevention)", !!settings.combatSystem)
        .toggle("Earn Money from Killing Mobs", !!settings.earnMoneyfromMobs)
        .toggle("Notify Mob Bounty in Chat", !!settings.notifyEarnMoneyInChat)
        .textField("Random Teleport (RTP) Radius Range:", "1000", String(settings.RTPRange || "1000"))
        .toggle("Use Popup UI for Teleport Requests", !!settings.tpaSystemWithUI)
        .toggle("Show Player Ranks in Chat Messages", !!settings.showRankOnMessage)
        .toggle("Show Player Ranks on Entity Nametags", !!settings.showRankOnNameTag);

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.runTimeout(backCallback, 5);
        return;
    }

    settings.combatSystem = res.formValues[0]
    settings.earnMoneyfromMobs = res.formValues[1]
    settings.notifyEarnMoneyInChat = res.formValues[2]
    settings.RTPRange = res.formValues[3]
    settings.tpaSystemWithUI = res.formValues[4]
    settings.showRankOnMessage = res.formValues[5]
    settings.showRankOnNameTag = res.formValues[6]

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fGameplay and feature settings saved successfully.")
    Kernel.system.runTimeout(backCallback, 5);
}

async function showAssetManifests(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GRID_M + "\u00A7d\u00A7lAsset Manifests")
        .textField("Banned Items (comma-separated):", "minecraft:tnt, etc.", (settings.bannedItems || []).join(", "))
        .textField("Hostile Mobs (comma-separated):", "minecraft:zombie, etc.", (settings.hostileMobs || []).join(", "));

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.runTimeout(backCallback, 5);
        return;
    }

    settings.bannedItems = res.formValues[0].split(",").map(s => s.trim()).filter(s => s.length > 0)
    settings.hostileMobs = res.formValues[1].split(",").map(s => s.trim()).filter(s => s.length > 0)

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fAsset manifests updated successfully.")
    Kernel.system.runTimeout(backCallback, 5);
}

async function showAuthorityLimits(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GRID_M + "\u00A7d\u00A7lAuthority \u0026 Limits")
        .textField("Menu Item ID (hardware GUI trigger):", "minecraft:compass", String(settings.menuItemId || "minecraft:compass"))
        .textField("Super Admin Tags (comma-separated):", "Admin, op", (settings.superAdminTags || []).join(", "))
        .textField("Default Rank (assigned to new players):", "member", String(settings.defaultRank || "member"))
        .textField("Max Homes (default limit if not set by rank):", "5", String(settings.maxHomes || "5"))
        .textField("TPA Expiration TTL (seconds):", "60", String(settings.tpaExpiration || "60"))
        .textField("Default Claim Radius (chunks):", "1", String(settings.defaultClaimRadius || "1"));

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.runTimeout(backCallback, 5);
        return;
    }

    settings.menuItemId = res.formValues[0]
    settings.superAdminTags = res.formValues[1].split(",").map(s => s.trim()).filter(s => s.length > 0)
    settings.defaultRank = res.formValues[2]
    settings.maxHomes = parseInt(res.formValues[3]) || 5
    settings.tpaExpiration = parseInt(res.formValues[4]) || 60
    settings.defaultClaimRadius = parseInt(res.formValues[5]) || 1

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fAuthority and limits updated successfully.")
    Kernel.system.runTimeout(backCallback, 5);
}
