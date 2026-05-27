/**
 * Admin Panel Settings - Global category-based system configuration
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"
import { UIUtils } from "../../ui/UIUtils.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"

export async function showServerSettings(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }

    const form = new Kernel.ActionFormData()
        .title("\u00A76\u00A7lSYSTEM SETTINGS")
        .body("\u00A77Select a configuration category to modify global server variables.")
        .button("\u00A7eCore Configuration\n\u00A78Money bounds, prefixes, text info", "textures/ui/settings_glyph_complex")
        .button("\u00A7aSystem Modules\n\u00A78Toggle core mechanics and subsystems", "textures/ui/world_glyph")
        .button("\u00A7bGameplay & Features\n\u00A78PVP, cooldowns, display options", "textures/ui/sword_glyph")
        .button("\u00A7dAsset Manifests\n\u00A78Banned items and hostile mobs", "textures/ui/hammer_anvil")
        .button("\u00A7gAuthority & Limits\n\u00A78Admin tags, default ranks, bounds", "textures/ui/shield_glyph")
        .button("\u00A7cRank Permissions\n\u00A78In-game rank permission editor", "textures/ui/icon_multiplayer")
        .button("\u00A7cBACK", "textures/ui/refresh");

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        await showAdminPanel(player)
        return
    }

    const settings = SettingsStore.getAll()
    const back = () => {
        Kernel.system.runTimeout(() => showServerSettings(player), 5)
    }

    switch (res.selection) {
        case 0:
            Kernel.system.runTimeout(() => showCoreSettings(player, settings, back), 5)
            break
        case 1:
            Kernel.system.runTimeout(() => showSystemModules(player, settings, back), 5)
            break
        case 2:
            Kernel.system.runTimeout(() => showGameplayFeatures(player, settings, back), 5)
            break
        case 3:
            Kernel.system.runTimeout(() => showAssetManifests(player, settings, back), 5)
            break
        case 4:
            Kernel.system.runTimeout(() => showAuthorityLimits(player, settings, back), 5)
            break
        case 5:
            Kernel.system.runTimeout(() => showRankPermissions(player, settings, back), 5)
            break
        case 6:
            await showAdminPanel(player)
            break
    }
}

async function showCoreSettings(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lCore Configuration")
        .textField("Starter Money (credits assigned on first spawn):", "1000", String(settings.starterMoney || "1000"))
        .textField("Max Money Cap (safe liquidity ceiling):", "1e+32", String(settings.maxMoney || "1e+32"))
        .textField("Command Prefix (triggers chat commands):", "-", String(settings.commandPrefix || "-"))
        .textField("Currency Symbol/Prefix (displayed on screens):", "$", String(settings.currencyPrefix || "$"))
        .textField("Server Info Details (used in help descriptions):", "Made by Wladyslaw", String(settings.serverInfo || ""))
        .textField("Welcome/Join Message (sent when players join):", "Welcome!", String(settings.joinMessage || ""));

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    settings.starterMoney = res.formValues[0]
    settings.maxMoney = res.formValues[1]
    settings.commandPrefix = res.formValues[2]
    settings.currencyPrefix = res.formValues[3]
    settings.serverInfo = res.formValues[4]
    settings.joinMessage = res.formValues[5]

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fCore configuration saved successfully.")
    backCallback()
}

async function showSystemModules(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title("\u00A7a\u00A7lSystem Modules")
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
    if (res.canceled) return backCallback()

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
    backCallback()
}

async function showGameplayFeatures(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title("\u00A7b\u00A7lGameplay & Features")
        .toggle("Combat Teleport Block (pvp tag prevention)", !!settings.combatSystem)
        .toggle("Earn Money from Killing Mobs", !!settings.earnMoneyfromMobs)
        .toggle("Notify Mob Bounty in Chat", !!settings.notifyEarnMoneyInChat)
        .textField("Random Teleport (RTP) Radius Range:", "1000", String(settings.RTPRange || "1000"))
        .toggle("Use Popup UI for Teleport Requests", !!settings.tpaSystemWithUI)
        .toggle("Show Player Ranks in Chat Messages", !!settings.showRankOnMessage)
        .toggle("Show Player Ranks on Entity Nametags", !!settings.showRankOnNameTag);

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    settings.combatSystem = res.formValues[0]
    settings.earnMoneyfromMobs = res.formValues[1]
    settings.notifyEarnMoneyInChat = res.formValues[2]
    settings.RTPRange = res.formValues[3]
    settings.tpaSystemWithUI = res.formValues[4]
    settings.showRankOnMessage = res.formValues[5]
    settings.showRankOnNameTag = res.formValues[6]

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fGameplay and feature settings saved successfully.")
    backCallback()
}

async function showAssetManifests(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title("\u00A7d\u00A7lAsset Manifests")
        .textField("Banned Items (comma-separated):", "minecraft:tnt, etc.", (settings.bannedItems || []).join(", "))
        .textField("Hostile Mobs (comma-separated):", "minecraft:zombie, etc.", (settings.hostileMobs || []).join(", "));

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    settings.bannedItems = res.formValues[0].split(",").map(s => s.trim()).filter(s => s.length > 0)
    settings.hostileMobs = res.formValues[1].split(",").map(s => s.trim()).filter(s => s.length > 0)

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fAsset manifests updated successfully.")
    backCallback()
}

async function showAuthorityLimits(player, settings, backCallback) {
    const form = new Kernel.ModalFormData()
        .title("\u00A7g\u00A7lAuthority & Limits")
        .textField("Menu Item ID (hardware GUI trigger):", "minecraft:compass", String(settings.menuItemId || "minecraft:compass"))
        .textField("Super Admin Tags (comma-separated):", "Admin, op", (settings.superAdminTags || []).join(", "))
        .textField("Default Rank (assigned to new players):", "member", String(settings.defaultRank || "member"))
        .textField("Max Homes (default limit if not set by rank):", "5", String(settings.maxHomes || "5"))
        .textField("TPA Expiration TTL (seconds):", "60", String(settings.tpaExpiration || "60"))
        .textField("Default Claim Radius (chunks):", "1", String(settings.defaultClaimRadius || "1"));

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    settings.menuItemId = res.formValues[0]
    settings.superAdminTags = res.formValues[1].split(",").map(s => s.trim()).filter(s => s.length > 0)
    settings.defaultRank = res.formValues[2]
    settings.maxHomes = parseInt(res.formValues[3]) || 5
    settings.tpaExpiration = parseInt(res.formValues[4]) || 60
    settings.defaultClaimRadius = parseInt(res.formValues[5]) || 1

    SettingsStore.updateAll(settings)
    player.sendMessage("\u00A7a\u00A7l» \u00A7fAuthority and limits updated successfully.")
    backCallback()
}

async function showRankPermissions(player, settings, backCallback) {
    const ranks = RankSystem.getAllRanks() || {}
    const rankTags = Object.keys(ranks)

    if (rankTags.length === 0) {
        player.sendMessage("\u00A7cNo ranks registered in the system.")
        return backCallback()
    }

    const form = new Kernel.ActionFormData()
        .title("\u00A7c\u00A7lRank Permissions")
        .body("\u00A77Select a rank to modify its clearance-level permission nodes.")

    for (const tag of rankTags) {
        const r = ranks[tag]
        form.button(`\u00A7e${r.name || tag}\n\u00A78Tag: ${tag} | Order: ${r.order || 0}`)
    }
    form.button("\u00A7cBACK")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === rankTags.length) {
        return backCallback()
    }

    const selectedRankTag = rankTags[res.selection]
    Kernel.system.runTimeout(() => showRankEditMenu(player, selectedRankTag, backCallback), 5)
}

async function showRankEditMenu(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) {
        player.sendMessage("\u00A7cRank not found.")
        return backCallback()
    }

    const form = new Kernel.ActionFormData()
        .title(`\u00A7e\u00A7lRank: ${rankTag}`)
        .body(`\u00A77Name: ${rank.colorText || ""}${rank.name}\n\u00A77Order: \u00A7e${rank.order}`)
        .button("\u00A7aModify Permission Nodes\n\u00A78Edit or delete existing permissions")
        .button("\u00A7bAdd Permission Node\n\u00A78Add a new permission to this rank")
        .button("\u00A7cBACK")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === 2) {
        Kernel.system.runTimeout(() => showRankPermissions(player, SettingsStore.getAll(), backCallback), 5)
        return
    }

    if (res.selection === 0) {
        Kernel.system.runTimeout(() => showRankModifyPermissions(player, rankTag, rank, () => showRankEditMenu(player, rankTag, backCallback)), 5)
    } else if (res.selection === 1) {
        Kernel.system.runTimeout(() => showRankAddPermission(player, rankTag, rank, () => showRankEditMenu(player, rankTag, backCallback)), 5)
    }
}

async function showRankModifyPermissions(player, rankTag, rank, backCallback) {
    const permissions = Object.entries(rank.permissions || {})
    if (permissions.length === 0) {
        player.sendMessage("\u00A7cNo permission nodes found on this rank.")
        const form = new Kernel.ActionFormData()
            .title("\u00A7cNo Permissions")
            .body("\u00A77This rank has no permission nodes.")
            .button("\u00A7cBACK")
        await UIUtils.showForm(player, form)
        return backCallback()
    }

    const form = new Kernel.ActionFormData()
        .title(`\u00A7c\u00A7lModify: ${rankTag}`)
        .body("\u00A77Select a permission node to edit its value or remove it.")

    for (const [perm, val] of permissions) {
        form.button(`\u00A7e${perm}\n\u00A78Value: ${val}`)
    }
    form.button("\u00A7cBACK")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === permissions.length) {
        return backCallback()
    }

    const [permName, permValue] = permissions[res.selection]
    Kernel.system.runTimeout(() => showEditPermissionNode(player, rankTag, rank, permName, permValue, backCallback), 5)
}

async function showEditPermissionNode(player, rankTag, rank, permName, permValue, backCallback) {
    const form = new Kernel.ModalFormData()
        .title(`\u00A7eEdit: ${permName}`)
        .textField("Value (true, false, or a number):", "true", String(permValue))
        .toggle("Remove this permission node", false);

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    const valueStr = res.formValues[0]
    const removeNode = res.formValues[1]

    if (removeNode) {
        delete rank.permissions[permName]
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fPermission \u00A7e${permName}\u00A7f removed from rank \u00A7e${rankTag}\u00A7f.`)
    } else {
        let parsedVal;
        if (valueStr.toLowerCase() === "true" || valueStr === "1") {
            parsedVal = true
        } else if (valueStr.toLowerCase() === "false" || valueStr === "2") {
            parsedVal = false
        } else {
            const num = Number(valueStr)
            if (!isNaN(num)) {
                parsedVal = num
            } else {
                parsedVal = valueStr
            }
        }
        rank.permissions[permName] = parsedVal
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fPermission \u00A7e${permName}\u00A7f set to \u00A7e${parsedVal}\u00A7f for rank \u00A7e${rankTag}\u00A7f.`)
    }

    const success = RankSystem.updateRank(rankTag, rank)
    if (!success) {
        player.sendMessage("\u00A7cFailed to update rank permissions.")
    }
    backCallback()
}

async function showRankAddPermission(player, rankTag, rank, backCallback) {
    const form = new Kernel.ModalFormData()
        .title(`\u00A7eAdd Perm to ${rankTag}`)
        .textField("Permission Node Name (e.g., essentials.warp):", "essentials.fly", "")
        .textField("Value (true, false, or a number):", "true", "true");

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    const nodeName = res.formValues[0].trim()
    const valueStr = res.formValues[1]

    if (!nodeName) {
        player.sendMessage("\u00A7cPermission node name cannot be empty.")
        return backCallback()
    }

    let parsedVal;
    if (valueStr.toLowerCase() === "true" || valueStr === "1") {
        parsedVal = true
    } else if (valueStr.toLowerCase() === "false" || valueStr === "2") {
        parsedVal = false
    } else {
        const num = Number(valueStr)
        if (!isNaN(num)) {
            parsedVal = num
        } else {
            parsedVal = valueStr
        }
    }

    if (!rank.permissions) {
        rank.permissions = {}
    }
    rank.permissions[nodeName] = parsedVal
    
    const success = RankSystem.updateRank(rankTag, rank)
    if (success) {
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fPermission \u00A7e${nodeName}\u00A7f added with value \u00A7e${parsedVal}\u00A7f.`)
    } else {
        player.sendMessage("\u00A7cFailed to update rank permissions.")
    }
    backCallback()
}
