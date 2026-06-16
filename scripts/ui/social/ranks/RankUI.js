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

import { Kernel } from "../../../core/Kernel.js";
import { UIUtils } from "../../UIUtils.js";
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js";
import { Lang } from "../../Lang.js";

export class RankUI {
    static async showRankList(player, backCallback = null) {
        const ranks = RankSystem.getAllRanks();
        const form = new Kernel.ActionFormData()
            .title(Lang.GRID_L + "§6§lRANK MANAGER")
            .body("§7Select a rank to edit or create a new one.");
        
        const rankKeys = Object.keys(ranks).filter(tag => ranks[tag] !== undefined);
        for (const tag of rankKeys) {
            const data = ranks[tag];
            form.button(`${data.colorText || ""}${data.name || tag} §8(${tag})\n§7Order: ${data.order || 0}`, "textures/ui/op");
        }
        form.button("§a§l+ CREATE NEW RANK", "textures/ui/plus");
        form.button("§cBACK", "textures/ui/refresh");

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return;

        if (res.selection === rankKeys.length) {
            Kernel.system.runTimeout(() => {
                this.showCreateRank(player, () => this.showRankList(player, backCallback));
            }, 5);
        } else if (res.selection === rankKeys.length + 1) {
            if (backCallback) {
                Kernel.system.runTimeout(backCallback, 5);
            } else {
                const { MainGUI } = await import("../../MainGUI.js");
                Kernel.system.runTimeout(() => {
                    MainGUI.showMainMenu(player);
                }, 5);
            }
        } else {
            const tag = rankKeys[res.selection];
            Kernel.system.runTimeout(() => {
                this.showRankActions(player, tag, backCallback);
            }, 5);
        }
    }

    static async showEditRanks(player, backCallback = null) {
        return this.showRankList(player, backCallback);
    }

    static async showEditRankActions(player, tag, backCallback = null) {
        return this.showRankActions(player, tag, backCallback);
    }

    static async showCreateRank(player, backCallback) {
        const ranks = RankSystem.getAllRanks();
        const otherRankKeys = Object.keys(ranks);
        const options = ["None (Default)", ...otherRankKeys];

        const form = new Kernel.ModalFormData()
            .title(Lang.GRID_M + "§6§lCREATE RANK")
            .textField("Rank Tag (Unique ID, alphanumeric only):", "e.g. vip")
            .textField("Display Name:", "e.g. [VIP]")
            .textField("Order:", "e.g. 10", "0")
            .textField("Chat Color:", "e.g. §b", "§7")
            .textField("Name Color:", "e.g. §e", "§7")
            .toggle("Hide Rank", false)
            .dropdown("Inherit Permissions From Parent Rank:", options, 0);

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) {
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        const tag = res.formValues[0]?.trim();
        const name = res.formValues[1]?.trim();
        const order = parseInt(res.formValues[2]) || 0;
        const chatColor = res.formValues[3] || "§7";
        const nameColor = res.formValues[4] || "§7";
        const hideRank = res.formValues[5];
        const selectionIndex = res.formValues[6];

        if (!tag) {
            player.sendMessage("§cInvalid Rank Tag.");
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(tag)) {
            player.sendMessage("§cInvalid Rank Tag: Only alphanumeric characters and underscores are allowed.");
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        if (RankSystem.getRank(tag)) {
            player.sendMessage("§cFailed to create rank: Tag already exists.");
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        const parentRank = selectionIndex === 0 ? null : otherRankKeys[selectionIndex - 1];

        const newRank = {
            name: name || tag,
            order: order,
            colorText: chatColor,
            colorName: nameColor,
            hideRanks: hideRank,
            permissions: {},
            inherits: parentRank
        };

        if (RankSystem.createRank(tag, newRank)) {
            player.sendMessage(`§aSuccessfully created rank: ${tag}`);
            Kernel.system.runTimeout(() => {
                this.showRankActions(player, tag);
            }, 5);
        } else {
            player.sendMessage("§cFailed to create rank.");
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
        }
    }

    static async showRankActions(player, tag, backCallback = null) {
        const rank = RankSystem.getRank(tag);
        if (!rank) {
            player.sendMessage("§cRank not found.");
            return this.showRankList(player, backCallback);
        }

        const form = new Kernel.ActionFormData()
            .title(Lang.GRID_L + `§6§lEDIT RANK: ${tag}`)
            .body(`§7Display: ${rank.colorText || ""}${rank.name || tag}\n§7Order: ${rank.order || 0}`)
            .button("§eBasic Settings", "textures/items/feather")
            .button("§bBasic Permissions", "textures/items/book_writable")
            .button("§aAdmin Permissions", "textures/ui/shield_glyph")
            .button("§dCommand Costs", "textures/items/gold_nugget")
            .button("§cCooldowns & Limits", "textures/items/clock")
            .button("§4Delete Rank", "textures/blocks/barrier")
            .button("§cBACK", "textures/ui/refresh");

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) {
            Kernel.system.runTimeout(() => this.showRankList(player, backCallback), 5);
            return;
        }

        const back = () => {
            Kernel.system.runTimeout(() => this.showRankActions(player, tag, backCallback), 5);
        };

        switch (res.selection) {
            case 0:
                Kernel.system.runTimeout(() => this.showBasicSettings(player, tag, back), 5);
                break;
            case 1:
                Kernel.system.runTimeout(() => this.showBasicPermissions(player, tag, back), 5);
                break;
            case 2:
                Kernel.system.runTimeout(() => this.showAdminPermissions(player, tag, back), 5);
                break;
            case 3:
                Kernel.system.runTimeout(() => this.showCostsUI(player, tag, back), 5);
                break;
            case 4:
                Kernel.system.runTimeout(() => this.showCooldownsLimitsUI(player, tag, back), 5);
                break;
            case 5:
                Kernel.system.runTimeout(() => this.confirmDeleteRank(player, tag, () => this.showRankList(player, backCallback)), 5);
                break;
            case 6:
                Kernel.system.runTimeout(() => this.showRankList(player, backCallback), 5);
                break;
        }
    }

    static async showBasicSettings(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();

        const ranks = RankSystem.getAllRanks();
        const otherRankKeys = Object.keys(ranks).filter(r => r !== tag);
        const options = ["None (Default)", ...otherRankKeys];
        
        let defaultValueIndex = 0;
        if (rank.inherits && otherRankKeys.includes(rank.inherits)) {
            defaultValueIndex = otherRankKeys.indexOf(rank.inherits) + 1;
        }

        const form = new Kernel.ModalFormData()
            .title(Lang.GRID_M + "§6§lBASIC SETTINGS")
            .textField("Display Name:", "e.g. VIP", String(rank.name || ""))
            .textField("Order:", "e.g. 10", String(rank.order || 0))
            .textField("Name Color:", "e.g. §e", String(rank.colorName || "§f"))
            .textField("Chat Color:", "e.g. §b", String(rank.colorText || "§f"))
            .toggle("Hide Rank Tag", !!rank.hideRanks)
            .dropdown("Inherit Permissions From:", options, defaultValueIndex);

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        rank.name = res.formValues[0]?.trim() || tag;
        rank.order = parseInt(res.formValues[1]) || 0;
        rank.colorName = res.formValues[2] || "§f";
        rank.colorText = res.formValues[3] || "§f";
        rank.hideRanks = res.formValues[4];

        const selectionIndex = res.formValues[5];
        if (selectionIndex === 0) {
            rank.inherits = null;
        } else {
            rank.inherits = otherRankKeys[selectionIndex - 1];
        }

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`§aUpdated basic settings for rank: ${tag}`);
        backCallback();
    }

    static async showBasicPermissions(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();
        const p = rank.permissions || {};

        const options = ["No action (Default)", "Allow", "Deny"];

        const nodes = [
            { label: "Home Command (essentials.home)", key: "essentials.home" },
            { label: "Set Home Command (essentials.sethome)", key: "essentials.sethome" },
            { label: "Delete Home Command (essentials.delhome)", key: "essentials.delhome" },
            { label: "Spawn Command (essentials.spawn)", key: "essentials.spawn" },
            { label: "TPA Command (essentials.tpa)", key: "essentials.tpa" },
            { label: "TPA Accept Command (essentials.tpaccept)", key: "essentials.tpaccept" },
            { label: "TPA Deny Command (essentials.tpadeny)", key: "essentials.tpadeny" },
            { label: "TPA Cancel Command (essentials.tpacancel)", key: "essentials.tpacancel" },
            { label: "TPA Here Command (essentials.tpahere)", key: "essentials.tpahere" },
            { label: "Pay Command (essentials.pay)", key: "essentials.pay" },
            { label: "Money Command (essentials.money)", key: "essentials.money" },
            { label: "Withdraw Command (essentials.withdraw)", key: "essentials.withdraw" },
            { label: "Shop Command (essentials.shop)", key: "essentials.shop" },
            { label: "Sell Command (essentials.sell)", key: "essentials.sell" },
            { label: "Auction Command (essentials.auction)", key: "essentials.auction" },
            { label: "Back Command (essentials.back)", key: "essentials.back" },
            { label: "Menu Command (essentials.menu)", key: "essentials.menu" },
            { label: "Chat Color Formatting (essentials.chat.color)", key: "essentials.chat.color" },
            { label: "Fly Command (essentials.fly)", key: "essentials.fly" },
            { label: "Heal Command (essentials.heal)", key: "essentials.heal" },
            { label: "Feed Command (essentials.feed)", key: "essentials.feed" },
            { label: "God Command (essentials.god)", key: "essentials.god" },
            { label: "Clear Command (essentials.clear)", key: "essentials.clear" },
            { label: "Chest Shop Create (Selling) (chestshop.create.sell)", key: "chestshop.create.sell" },
            { label: "Chest Shop Create (Buying) (chestshop.create.buy)", key: "chestshop.create.buy" },
            { label: "Chest Shop Sell (chestshop.sell)", key: "chestshop.sell" },
            { label: "Chest Shop Buy (chestshop.buy)", key: "chestshop.buy" },
            { label: "Land Claim Command (land.claim)", key: "land.claim" },
            { label: "Land Unclaim Command (land.unclaim)", key: "land.unclaim" },
            { label: "Land Invite Command (land.invite)", key: "land.invite" },
            { label: "Land Kick Command (land.kick)", key: "land.kick" },
            { label: "Land Transfer Command (land.transfer)", key: "land.transfer" },
            { label: "Land Setting Command (land.setting)", key: "land.setting" }
        ];

        const form = new Kernel.ModalFormData().title(Lang.GRID_M + "§6§lBASIC PERMISSIONS");
        nodes.forEach(node => {
            let val = 0;
            if (p[node.key] === true) val = 1;
            else if (p[node.key] === false) val = 2;
            form.dropdown(node.label, options, val);
        });

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        if (!rank.permissions) rank.permissions = {};
        nodes.forEach((node, index) => {
            const selection = res.formValues[index];
            if (selection === 1) {
                rank.permissions[node.key] = true;
            } else if (selection === 2) {
                rank.permissions[node.key] = false;
            } else {
                delete rank.permissions[node.key];
            }
        });

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`§aUpdated basic permissions for rank: ${tag}`);
        backCallback();
    }

    static async showAdminPermissions(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();
        const p = rank.permissions || {};

        const options = ["No action (Default)", "Allow", "Deny"];

        const nodes = [
            { label: "Admin Panel Command (admin.panel)", key: "admin.panel" },
            { label: "Ban Command (admin.ban)", key: "admin.ban" },
            { label: "Kick Command (admin.kick)", key: "admin.kick" },
            { label: "Mute Command (admin.mute)", key: "admin.mute" },
            { label: "View Reports (admin.reports)", key: "admin.reports" },
            { label: "Broadcast Command (admin.broadcast)", key: "admin.broadcast" },
            { label: "Floating Text Command (admin.floatingtext)", key: "admin.floatingtext" },
            { label: "Inventory See Command (admin.invsee)", key: "admin.invsee" },
            { label: "Manage Ranks Command (admin.ranks)", key: "admin.ranks" },
            { label: "Setting Command (admin.setting)", key: "admin.setting" },
            { label: "Shop Setting Command (admin.shopsetting)", key: "admin.shopsetting" },
            { label: "Land Setting Command (admin.landsetting)", key: "admin.landsetting" },
            { label: "Manage Economy (admin.economy)", key: "admin.economy" },
            { label: "Admin Teleport Command (admin.tp)", key: "admin.tp" },
            { label: "Admin Warp Command (admin.warp)", key: "admin.warp" },
            { label: "Gamemode Creative (admin.gm.c)", key: "admin.gm.c" },
            { label: "Gamemode Survival (admin.gm.s)", key: "admin.gm.s" },
            { label: "Gamemode Spectator (admin.gm.sp)", key: "admin.gm.sp" },
            { label: "Gamemode Adventure (admin.gm.a)", key: "admin.gm.a" }
        ];

        const form = new Kernel.ModalFormData().title(Lang.GRID_M + "§c§lADMIN PERMISSIONS");
        nodes.forEach(node => {
            let val = 0;
            if (p[node.key] === true) val = 1;
            else if (p[node.key] === false) val = 2;
            form.dropdown(node.label, options, val);
        });

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        if (!rank.permissions) rank.permissions = {};
        nodes.forEach((node, index) => {
            const selection = res.formValues[index];
            if (selection === 1) {
                rank.permissions[node.key] = true;
            } else if (selection === 2) {
                rank.permissions[node.key] = false;
            } else {
                delete rank.permissions[node.key];
            }
        });

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`§aUpdated admin permissions for rank: ${tag}`);
        backCallback();
    }

    static async showCostsUI(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();
        const p = rank.permissions || {};

        const form = new Kernel.ModalFormData()
            .title(Lang.GRID_M + "§6§lCOMMAND COSTS")
            .textField("Back Cost:", "Leave blank to use default", String(p["cost.back"] !== undefined ? p["cost.back"] : ""))
            .textField("TPA Cost:", "Leave blank to use default", String(p["cost.tpa"] !== undefined ? p["cost.tpa"] : ""))
            .textField("Home Cost:", "Leave blank to use default", String(p["cost.home"] !== undefined ? p["cost.home"] : ""))
            .textField("Warp Cost:", "Leave blank to use default", String(p["cost.warp"] !== undefined ? p["cost.warp"] : ""))
            .textField("RTP Cost:", "Leave blank to use default", String(p["cost.rtp"] !== undefined ? p["cost.rtp"] : ""));

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        if (!rank.permissions) rank.permissions = {};

        const keys = ["cost.back", "cost.tpa", "cost.home", "cost.warp", "cost.rtp"];
        keys.forEach((key, index) => {
            const valStr = String(res.formValues[index] || "").trim();
            if (valStr === "") {
                delete rank.permissions[key];
            } else {
                const parsed = parseFloat(valStr);
                rank.permissions[key] = isNaN(parsed) ? 0 : parsed;
            }
        });

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`§aUpdated costs for rank: ${tag}`);
        backCallback();
    }

    static async showCooldownsLimitsUI(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();
        const p = rank.permissions || {};
        const s = (val) => (val !== undefined && val !== null) ? String(val) : "";

        const form = new Kernel.ModalFormData()
            .title(Lang.GRID_M + "§6§lCOOLDOWNS & LIMITS")
            .textField("Chat Cooldown (seconds):", "e.g. 0.5", s(p["cooldown.chat"]))
            .textField("Command Cooldown (seconds):", "e.g. 1.0", s(p["cooldown.command"]))
            .textField("Back Cooldown (seconds):", "e.g. 60", s(p["cooldown.back"]))
            .textField("TPA Cooldown (seconds):", "e.g. 60", s(p["cooldown.tpa"]))
            .textField("Home Cooldown (seconds):", "e.g. 60", s(p["cooldown.home"]))
            .textField("Warp Cooldown (seconds):", "e.g. 60", s(p["cooldown.warp"]))
            .textField("RTP Cooldown (seconds):", "e.g. 60", s(p["cooldown.rtp"]))
            .textField("Home Limit:", "e.g. 3", s(p["limit.home"]))
            .textField("Land Claim Limit:", "e.g. 1", s(p["limit.land"]));

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        if (!rank.permissions) rank.permissions = {};

        const keys = [
            "cooldown.chat", "cooldown.command", "cooldown.back", "cooldown.tpa",
            "cooldown.home", "cooldown.warp", "cooldown.rtp"
        ];
        keys.forEach((key, index) => {
            const valStr = String(res.formValues[index] || "").trim();
            if (valStr === "") {
                delete rank.permissions[key];
            } else {
                const parsed = parseFloat(valStr);
                rank.permissions[key] = isNaN(parsed) ? 0 : parsed;
            }
        });

        const homeLimitStr = String(res.formValues[7] || "").trim();
        if (homeLimitStr === "") {
            delete rank.permissions["limit.home"];
        } else {
            const parsed = parseInt(homeLimitStr);
            rank.permissions["limit.home"] = isNaN(parsed) ? 3 : parsed;
        }

        const landLimitStr = String(res.formValues[8] || "").trim();
        if (landLimitStr === "") {
            delete rank.permissions["limit.land"];
        } else {
            const parsed = parseInt(landLimitStr);
            rank.permissions["limit.land"] = isNaN(parsed) ? 1 : parsed;
        }

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`§aUpdated cooldowns & limits for rank: ${tag}`);
        backCallback();
    }

    static async confirmDeleteRank(player, tag, backCallback) {
        const form = new Kernel.MessageFormData()
            .title(Lang.GRID_M + "§4§lDELETE RANK?")
            .body(`§7Are you sure you want to delete the rank "§e${tag}§7"?\n§cThis will strip the rank tag from all online players!`)
            .button1("§aYes, Delete")
            .button2("§cNo, Cancel");

        const res = await UIUtils.showForm(player, form);
        if (res.canceled || res.selection !== 0) {
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        if (RankSystem.deleteRank(tag)) {
            for (const p of Kernel.world.getAllPlayers()) {
                if (p.isValid && p.getTags().includes(tag)) {
                    p.removeTag(tag);
                }
            }
            player.sendMessage(`§aSuccessfully deleted rank: ${tag}`);
        } else {
            player.sendMessage("§cFailed to delete rank.");
        }

        if (backCallback) Kernel.system.runTimeout(backCallback, 5);
    }
}
