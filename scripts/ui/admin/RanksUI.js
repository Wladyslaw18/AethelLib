/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  [ NOBLE INFRASTRUCTURE CORE ]
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Kernel } from "../../core/Kernel.js"
import { UIUtils } from "../UIUtils.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { Lang } from "../Lang.js"

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export async function showRanksUI(player, backCallback) {
    const backToRanks = async () => await showRanksUI(player, backCallback)

    const form = new Kernel.ActionFormData()
        .title("§6RANK §fMANAGER")
        .body("Select an administrative action for the rank manifest.")
        .button("§6Create Rank\n§7Forge a new relic", "textures/ui/color_plus")
        .button("§eEdit Ranks\n§7Deep-dive into permissions", "textures/ui/settings_glyph_complex")
        .button("§7§l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === 2) {
        return backCallback()
    }

    switch (res.selection) {
        case 0: await showAddRank(player, backToRanks); break
        case 1: await showEditRanksSelect(player, backToRanks); break
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE RANK
// ─────────────────────────────────────────────────────────────────────────────

async function showAddRank(player, backCallback) {
    const form = new Kernel.ModalFormData()
        .title("§6RANK §fFORGE")
        .textField("RANK IDENTIFIER", "e.g. warlord")
        .textField("DISPLAY NAME", "e.g. §c[WARLORD]")
        .label("§7SELECT ESSENCE COLOR")
        .button("§0").button("§1").button("§2").button("§3").button("§4").button("§5").button("§6").button("§7")
        .button("§8").button("§9").button("§a").button("§b").button("§c").button("§d").button("§e").button("§f");

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) return backCallback();

    const tag = String(res.formValues[0] ?? "").trim().toLowerCase();
    const name = String(res.formValues[1] ?? "").trim();
    
    if (!tag || !/^[a-z0-9_]+$/.test(tag)) {
        player.sendMessage("§c§l» §fInvalid Rank ID.");
        return showAddRank(player, backCallback);
    }

    const success = RankSystem.createRank(tag, {
        name: name || tag.toUpperCase(),
        order: 1,
        permissions: {}
    });

    if (success) {
        player.sendMessage(`§a§l» §fRank §e${tag}§f created.`);
        player.playSound("random.levelup");
        return backCallback();
    } else {
        player.sendMessage(`§c§l» §fFailed to create rank.`);
        return backCallback();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECT RANK
// ─────────────────────────────────────────────────────────────────────────────

async function showEditRanksSelect(player, backCallback) {
    const ranks = RankSystem.getAllRanks() || {}
    const rankTags = Object.keys(ranks)

    if (rankTags.length === 0) {
        player.sendMessage("§cNo ranks found.")
        return backCallback()
    }

    const form = new Kernel.ActionFormData()
        .title("§6SELECT §fRANK")
        .body("Choose a rank to modify in the deep editor.");

    rankTags.forEach(tag => {
        form.button(`§e${ranks[tag].name || tag}\n§8ID: ${tag}`);
    });
    form.button("§7§l[BACK]");

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === rankTags.length) return backCallback()

    await showEditRank(player, rankTags[res.selection], backCallback)
}

// ─────────────────────────────────────────────────────────────────────────────
// DEEP RANK EDITOR (INDUSTRIAL DOD DEPTH)
// ─────────────────────────────────────────────────────────────────────────────

async function showEditRank(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag);
    if (!rank) return backCallback();

    const p = rank.permissions || {};
    const s = (val) => (val !== undefined && val !== null) ? String(val) : "";

    const form = new Kernel.ModalFormData()
        .title(`§6RANK EDITOR: §f${rankTag}`)
        
        // --- CATEGORY 1: CORE & LIMITS (7 Values) ---
        .label("§e[1] CORE IDENTITY & GLOBAL LIMITS")
        .textField("Display Name", "e.g. §c[OWNER]", rank.name || "")
        .textField("Rank Order", "0", String(rank.order ?? 0))
        .textField("Chat Cooldown", "0.5", s(p["cooldown.chat"] ?? rank.chatCooldown))
        .textField("Command Cooldown", "1.0", s(p["cooldown.command"] ?? rank.commandCooldown))
        .toggle("TPA Access", p["essentials.tpa"] !== false)
        .textField("Home Limit", "5", s(p["limit.home"] ?? rank.homeLimit))
        .textField("Claim Limit", "1", s(p["limit.land"] ?? rank.landClaimLimit))

        // --- CATEGORY 2: ADMINISTRATIVE POWERS (15 Values) ---
        .label("§c[2] ADMINISTRATIVE OVERLORD POWERS")
        .toggle("Admin Panel", p["admin.panel"] === true)
        .toggle("Ban Player", p["admin.ban"] === true)
        .toggle("Kick Player", p["admin.kick"] === true)
        .toggle("Mute Player", p["admin.mute"] === true)
        .toggle("View Reports", p["admin.reports"] === true)
        .toggle("Broadcast", p["admin.broadcast"] === true)
        .toggle("Floating Text", p["admin.floatingtext"] === true)
        .toggle("Inv-See", p["admin.invsee"] === true)
        .toggle("Manage Ranks", p["admin.ranks"] === true)
        .toggle("Admin Teleport", p["admin.tp"] === true)
        .toggle("Admin Warp", p["admin.warp"] === true)
        .toggle("Creative Mode", p["admin.gm.c"] === true)
        .toggle("Admin Claim Manage", p["admin.landsetting"] === true)
        .toggle("Manage Economy", p["admin.economy"] === true)
        .toggle("Manage Shop Config", p["admin.shopsetting"] === true)
        
        // --- CATEGORY 3: FEATURE COOLDOWNS (5 Values) ---
        .label("§b[3] SPATIAL COOLDOWNS (SECONDS)")
        .textField("Back Cooldown", "60", s(p["cooldown.back"] ?? rank.backCooldown))
        .textField("TPA Cooldown", "60", s(p["cooldown.tpa"] ?? rank.tpaCooldown))
        .textField("Home Cooldown", "60", s(p["cooldown.home"] ?? rank.homeCooldown))
        .textField("Warp Cooldown", "60", s(p["cooldown.warp"] ?? rank.warpCooldown))
        .textField("RTP Cooldown", "60", s(p["cooldown.rtp"] ?? rank.rtpCooldown))
        
        // --- CATEGORY 4: ECONOMY & SHOPS (9 Values) ---
        .label("§a[4] FEATURE COSTS & COMMERCE")
        .textField("Back Cost", "0", s(p["cost.back"] ?? rank.backCost))
        .textField("TPA Cost", "0", s(p["cost.tpa"] ?? rank.tpaCost))
        .textField("Home Cost", "0", s(p["cost.home"] ?? rank.homeCost))
        .textField("Warp Cost", "0", s(p["cost.warp"] ?? rank.warpCost))
        .textField("RTP Cost", "0", s(p["cost.rtp"] ?? rank.rtpCost))
        .toggle("Create Sell Shop", p["chestshop.create.sell"] === true)
        .toggle("Create Buy Shop", p["chestshop.create.buy"] === true)
        .toggle("Use Sell Shop", p["chestshop.sell"] === true)
        .toggle("Use Buy Shop", p["chestshop.buy"] === true);

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) return backCallback();

    const v = res.formValues;
    const updatedPermissions = { ...p };

    // INDEX MAPPING (Skipping labels)
    // --- Cat 1 (v[0-6]) ---
    updatedPermissions["cooldown.chat"] = parseFloat(v[2]) || 0.5;
    updatedPermissions["cooldown.command"] = parseFloat(v[3]) || 1.0;
    updatedPermissions["essentials.tpa"] = v[4] === true;
    updatedPermissions["limit.home"] = parseInt(v[5]) || 5;
    updatedPermissions["limit.land"] = parseInt(v[6]) || 1;

    // --- Cat 2 (v[7-21]) ---
    updatedPermissions["admin.panel"] = v[7] === true;
    updatedPermissions["admin.ban"] = v[8] === true;
    updatedPermissions["admin.kick"] = v[9] === true;
    updatedPermissions["admin.mute"] = v[10] === true;
    updatedPermissions["admin.reports"] = v[11] === true;
    updatedPermissions["admin.broadcast"] = v[12] === true;
    updatedPermissions["admin.floatingtext"] = v[13] === true;
    updatedPermissions["admin.invsee"] = v[14] === true;
    updatedPermissions["admin.ranks"] = v[15] === true;
    updatedPermissions["admin.tp"] = v[16] === true;
    updatedPermissions["admin.warp"] = v[17] === true;
    updatedPermissions["admin.gm.c"] = v[18] === true;
    updatedPermissions["admin.landsetting"] = v[19] === true;
    updatedPermissions["admin.economy"] = v[20] === true;
    updatedPermissions["admin.shopsetting"] = v[21] === true;

    // --- Cat 3 (v[22-26]) ---
    updatedPermissions["cooldown.back"] = parseFloat(v[22]) || 60;
    updatedPermissions["cooldown.tpa"] = parseFloat(v[23]) || 60;
    updatedPermissions["cooldown.home"] = parseFloat(v[24]) || 60;
    updatedPermissions["cooldown.warp"] = parseFloat(v[25]) || 60;
    updatedPermissions["cooldown.rtp"] = parseFloat(v[26]) || 60;

    // --- Cat 4 (v[27-35]) ---
    updatedPermissions["cost.back"] = parseFloat(v[27]) || 0;
    updatedPermissions["cost.tpa"] = parseFloat(v[28]) || 0;
    updatedPermissions["cost.home"] = parseFloat(v[29]) || 0;
    updatedPermissions["cost.warp"] = parseFloat(v[30]) || 0;
    updatedPermissions["cost.rtp"] = parseFloat(v[31]) || 0;
    updatedPermissions["chestshop.create.sell"] = v[32] === true;
    updatedPermissions["chestshop.create.buy"] = v[33] === true;
    updatedPermissions["chestshop.sell"] = v[34] === true;
    updatedPermissions["chestshop.buy"] = v[35] === true;

    const success = RankSystem.updateRank(rankTag, {
        ...rank,
        name: String(v[0] || rank.name || ""),
        order: parseInt(v[1]) || 0,
        permissions: updatedPermissions
    });

    if (success) {
        player.sendMessage(`§a§l» §fRank §e${rankTag}§f manifest updated.`);
        player.playSound("random.levelup", { pitch: 1.2 });
    } else {
        player.sendMessage(`§c§l» §fFailed to update §e${rankTag}§f.`);
    }

    return backCallback();
}
