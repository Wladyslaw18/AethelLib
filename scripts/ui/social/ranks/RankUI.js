import { Kernel } from "../../../core/Kernel.js";
import { UIUtils } from "../../UIUtils.js";
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js";
import { showAdminPermissions } from "./modules/RankAdminPermsUI.js";
import { showLandPermissions } from "./modules/RankLandPermsUI.js";
import { showChestShopPermissions } from "./modules/RankChestShopPermsUI.js";

/*
 * RankUI
 * ----------------------------------------------------------------------------
 * The primary unified interface-hub for rank management.
 */

export class RankUI {
    static async showRankList(player) {
        const ranks = RankSystem.getAllRanks();
        const form = new Kernel.ActionFormData()
            .title("\u00A76\u00A7lRANK MANAGER")
            .body("\u00A77Select a rank to edit or create a new one.");
        
        const rankKeys = Object.keys(ranks).filter(tag => ranks[tag] !== undefined);
        for (const tag of rankKeys) {
            const data = ranks[tag];
            form.button(`${data.colorText || ""}${data.name || tag} \u00A78(${tag})\n\u00A77Order: ${data.order || 0}`, "textures/ui/rank_icon");
        }
        form.button("\u00A7a\u00A7l+ CREATE NEW RANK", "textures/ui/plus");
        form.button("\u00A7cBACK", "textures/ui/refresh");

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return;

        if (res.selection === rankKeys.length) {
            Kernel.system.runTimeout(() => {
                this.showCreateRank(player, () => this.showRankList(player));
            }, 5);
        } else if (res.selection === rankKeys.length + 1) {
            const { MainGUI } = await import("../../MainGUI.js");
            Kernel.system.runTimeout(() => {
                MainGUI.showMainMenu(player);
            }, 5);
        } else {
            const tag = rankKeys[res.selection];
            Kernel.system.runTimeout(() => {
                this.showRankActions(player, tag);
            }, 5);
        }
    }

    static async showEditRanks(player) {
        return this.showRankList(player);
    }

    static async showEditRankActions(player, tag) {
        return this.showRankActions(player, tag);
    }

    static async showCreateRank(player, backCallback) {
        const ranks = RankSystem.getAllRanks();
        const otherRankKeys = Object.keys(ranks);
        const options = ["None (Default)", ...otherRankKeys];

        const form = new Kernel.ModalFormData()
            .title("\u00A76\u00A7lCREATE RANK")
            .textField("Rank Tag (Unique ID, alphanumeric only):", "e.g. vip")
            .textField("Display Name:", "e.g. [VIP]")
            .textField("Order:", "e.g. 10", "0")
            .textField("Chat Color:", "e.g. \u00A7b", "\u00A77")
            .textField("Name Color:", "e.g. \u00A7e", "\u00A77")
            .toggle("Hide Rank", false)
            .dropdown("Inherit Permissions From Parent Rank:", options, 0);

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) {
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        let tag = res.formValues[0]?.trim();
        const name = res.formValues[1]?.trim();
        const order = parseInt(res.formValues[2]) || 0;
        const chatColor = res.formValues[3] || "\u00A77";
        const nameColor = res.formValues[4] || "\u00A77";
        const hideRank = res.formValues[5];
        const selectionIndex = res.formValues[6];

        if (!tag) {
            player.sendMessage("\u00A7cInvalid Rank Tag.");
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(tag)) {
            player.sendMessage("\u00A7cInvalid Rank Tag: Only alphanumeric characters and underscores are allowed.");
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
            return;
        }

        if (RankSystem.getRank(tag)) {
            player.sendMessage("\u00A7cFailed to create rank: Tag already exists.");
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
            player.sendMessage(`\u00A7aSuccessfully created rank: ${tag}`);
            Kernel.system.runTimeout(() => {
                this.showRankActions(player, tag);
            }, 5);
        } else {
            player.sendMessage("\u00A7cFailed to create rank.");
            if (backCallback) Kernel.system.runTimeout(backCallback, 5);
        }
    }

    static async showRankActions(player, tag) {
        const rank = RankSystem.getRank(tag);
        if (!rank) {
            player.sendMessage("\u00A7cRank not found.");
            return this.showRankList(player);
        }

        const form = new Kernel.ActionFormData()
            .title(`\u00A76\u00A7lEDIT RANK: ${tag}`)
            .body(`\u00A77Display: ${rank.colorText || ""}${rank.name || tag}\n\u00A77Order: ${rank.order || 0}`)
            .button("\u00A7eBasic Settings", "textures/ui/edit")
            .button("\u00A7bPermissions", "textures/ui/permissions")
            .button("\u00A7aLimits", "textures/ui/limit")
            .button("\u00A7dCosts", "textures/ui/cost")
            .button("\u00A7cCooldowns", "textures/ui/cooldown")
            .button("\u00A74Delete Rank", "textures/ui/delete")
            .button("\u00A7cBACK", "textures/ui/refresh");

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) {
            Kernel.system.runTimeout(() => this.showRankList(player), 5);
            return;
        }

        const back = () => {
            Kernel.system.runTimeout(() => this.showRankActions(player, tag), 5);
        };

        switch (res.selection) {
            case 0:
                Kernel.system.runTimeout(() => this.showBasicSettings(player, tag, back), 5);
                break;
            case 1:
                Kernel.system.runTimeout(() => this.showPermissionsUI(player, tag, back), 5);
                break;
            case 2:
                Kernel.system.runTimeout(() => this.showLimitsUI(player, tag, back), 5);
                break;
            case 3:
                Kernel.system.runTimeout(() => this.showCostsUI(player, tag, back), 5);
                break;
            case 4:
                Kernel.system.runTimeout(() => this.showCooldownsUI(player, tag, back), 5);
                break;
            case 5:
                Kernel.system.runTimeout(() => this.confirmDeleteRank(player, tag, () => this.showRankList(player)), 5);
                break;
            case 6:
                Kernel.system.runTimeout(() => this.showRankList(player), 5);
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
            .title("\u00A76\u00A7lBASIC SETTINGS")
            .textField("Display Name:", "e.g. VIP", String(rank.name || ""))
            .textField("Order:", "e.g. 10", String(rank.order || 0))
            .textField("Name Color:", "e.g. \u00A7e", String(rank.colorName || "\u00A7f"))
            .textField("Chat Color:", "e.g. \u00A7b", String(rank.colorText || "\u00A7f"))
            .toggle("Hide Rank Tag", !!rank.hideRanks)
            .dropdown("Inherit Permissions From:", options, defaultValueIndex);

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        rank.name = res.formValues[0]?.trim() || tag;
        rank.order = parseInt(res.formValues[1]) || 0;
        rank.colorName = res.formValues[2] || "\u00A7f";
        rank.colorText = res.formValues[3] || "\u00A7f";
        rank.hideRanks = res.formValues[4];

        const selectionIndex = res.formValues[5];
        if (selectionIndex === 0) {
            rank.inherits = null;
        } else {
            rank.inherits = otherRankKeys[selectionIndex - 1];
        }

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`\u00A7aUpdated basic settings for rank: ${tag}`);
        backCallback();
    }

    static async showPermissionsUI(player, tag, backCallback) {
        const form = new Kernel.ActionFormData()
            .title("\u00A76\u00A7lRANK PERMISSIONS")
            .body("\u00A77Select a permission category to edit.")
            .button("\u00A7eAdmin Permissions", "textures/ui/permissions")
            .button("\u00A7aLand Permissions", "textures/ui/land")
            .button("\u00A7cChest Shop Permissions", "textures/ui/shop")
            .button("\u00A7cBACK", "textures/ui/refresh");

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        const subBack = () => {
            Kernel.system.runTimeout(() => this.showPermissionsUI(player, tag, backCallback), 5);
        };

        switch (res.selection) {
            case 0:
                Kernel.system.runTimeout(() => showAdminPermissions(player, tag, subBack), 5);
                break;
            case 1:
                Kernel.system.runTimeout(() => showLandPermissions(player, tag, subBack), 5);
                break;
            case 2:
                Kernel.system.runTimeout(() => showChestShopPermissions(player, tag, subBack), 5);
                break;
            case 3:
                backCallback();
                break;
        }
    }

    static async showLimitsUI(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();
        const p = rank.permissions || {};

        const form = new Kernel.ModalFormData()
            .title("\u00A76\u00A7lLIMITS")
            .textField("Home Limit:", "Input number here", String(p["limit.home"] !== undefined ? p["limit.home"] : "3"))
            .textField("Land Limit:", "Input number here", String(p["limit.land"] !== undefined ? p["limit.land"] : "1"));

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        if (!rank.permissions) rank.permissions = {};

        const homeLimit = parseInt(res.formValues[0]);
        const landLimit = parseInt(res.formValues[1]);

        if (isNaN(homeLimit)) delete rank.permissions["limit.home"];
        else rank.permissions["limit.home"] = homeLimit;

        if (isNaN(landLimit)) delete rank.permissions["limit.land"];
        else rank.permissions["limit.land"] = landLimit;

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`\u00A7aUpdated limits for rank: ${tag}`);
        backCallback();
    }

    static async showCostsUI(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();
        const p = rank.permissions || {};

        const form = new Kernel.ModalFormData()
            .title("\u00A76\u00A7lCOSTS")
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
        player.sendMessage(`\u00A7aUpdated costs for rank: ${tag}`);
        backCallback();
    }

    static async showCooldownsUI(player, tag, backCallback) {
        const rank = RankSystem.getRank(tag);
        if (!rank) return backCallback();
        const p = rank.permissions || {};

        const form = new Kernel.ModalFormData()
            .title("\u00A76\u00A7lCOOLDOWNS")
            .textField("Chat Cooldown:", "Leave blank to use default", String(p["cooldown.chat"] !== undefined ? p["cooldown.chat"] : ""))
            .textField("Back Cooldown:", "Leave blank to use default", String(p["cooldown.back"] !== undefined ? p["cooldown.back"] : ""))
            .textField("TPA Cooldown:", "Leave blank to use default", String(p["cooldown.tpa"] !== undefined ? p["cooldown.tpa"] : ""))
            .textField("Home Cooldown:", "Leave blank to use default", String(p["cooldown.home"] !== undefined ? p["cooldown.home"] : ""))
            .textField("Warp Cooldown:", "Leave blank to use default", String(p["cooldown.warp"] !== undefined ? p["cooldown.warp"] : ""))
            .textField("RTP Cooldown:", "Leave blank to use default", String(p["cooldown.rtp"] !== undefined ? p["cooldown.rtp"] : ""))
            .textField("Command Cooldown:", "Leave blank to use default", String(p["cooldown.command"] !== undefined ? p["cooldown.command"] : ""));

        const res = await UIUtils.showForm(player, form);
        if (res.canceled) return backCallback();

        if (!rank.permissions) rank.permissions = {};

        const keys = [
            "cooldown.chat", "cooldown.back", "cooldown.tpa", 
            "cooldown.home", "cooldown.warp", "cooldown.rtp", "cooldown.command"
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

        RankSystem.updateRank(tag, rank);
        player.sendMessage(`\u00A7aUpdated cooldowns for rank: ${tag}`);
        backCallback();
    }

    static async confirmDeleteRank(player, tag, backCallback) {
        const form = new Kernel.MessageFormData()
            .title("\u00A74\u00A7lDELETE RANK?")
            .body(`\u00A77Are you sure you want to delete the rank "\u00A7e${tag}\u00A77"?\n\u00A7cThis will strip the rank tag from all online players!`)
            .button1("\u00A7aYes, Delete")
            .button2("\u00A7cNo, Cancel");

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
            player.sendMessage(`\u00A7aSuccessfully deleted rank: ${tag}`);
        } else {
            player.sendMessage("\u00A7cFailed to delete rank.");
        }

        if (backCallback) Kernel.system.runTimeout(backCallback, 5);
    }
}
