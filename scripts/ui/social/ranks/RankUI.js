import { Kernel } from "../../../core/Kernel.js";
import { UIUtils } from "../../UIUtils.js"
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js"
import { showBasicSettings } from "./modules/RankSettingsUI.js"
import { showBasicPermissions } from "./modules/RankBasicPermsUI.js"
import { showAdminPermissions } from "./modules/RankAdminPermsUI.js"
import { showLandPermissions } from "./modules/RankLandPermsUI.js"
import { showChestShopPermissions } from "./modules/RankChestShopPermsUI.js"

/*
 * INDUSTRIAL_RANK_UI_NEXUS
 * ----------------------------------------------------------------------------
 * The primary interface-hub for hierarchy management. Orchestrates rank 
 * creation and deep-node calibration across all authority vectors.
 */

export class RankUI {
    static async showCreateRank(player) {
        const form = new Kernel.ModalFormData()
            .title("Add Rank")
            .textField("Rank Tag (Unique ID):", "e.g. vip")
            .textField("Display Text:", "e.g. \u00A7b[VIP]")

        const res = await UIUtils.showForm(player, form)
        if (res.canceled) return

        let [tag, name] = res.formValues
        if (!tag) return player.sendMessage("\u00A7cInvalid Rank Tag.")
        tag = tag.trim()

        // 1. Enforce alphanumeric character validation to prevent dynamic property key violations
        if (!/^[a-zA-Z0-9_]+$/.test(tag)) {
            return player.sendMessage("\u00A7cInvalid Rank Tag: Only alphanumeric characters and underscores are allowed.")
        }

        // 2. Prevent overwriting existing ranks
        if (RankSystem.getRank(tag)) {
            return player.sendMessage("\u00A7cFailed to create rank: Tag already exists.")
        }

        if (RankSystem.createRank(tag, { name: name || tag, order: 0, colorText: "\u00A7f", colorName: "\u00A7f", hideRanks: false, permissions: {} })) {
            player.sendMessage(`\u00A7aSuccessfully created rank: ${tag}`)
            // 3. Wait 5 ticks before opening the next UI to avoid native UserBusy/crashes
            Kernel.system.runTimeout(() => {
                this.showEditRankActions(player, tag)
            }, 5)
        } else {
            player.sendMessage("\u00A7cFailed to create rank.")
        }
    }

    static async showEditRanks(player) {
        const ranks = RankSystem.getAllRanks()
        // Safety guard: filter out undefined ranks to prevent TypeErrors
        const rankIds = Object.keys(ranks).filter(id => ranks[id] !== undefined)
        if (rankIds.length === 0) return player.sendMessage("\u00A7cNo ranks found.")

        const form = new Kernel.ModalFormData()
            .title("Edit Ranks")
            .dropdown("Select Ranks", rankIds.map(id => ranks[id].name || id))

        const res = await UIUtils.showForm(player, form)
        if (!res.canceled) {
            Kernel.system.runTimeout(() => {
                this.showEditRankActions(player, rankIds[res.formValues[0]])
            }, 5)
        }
    }

    static async showEditRankActions(player, rankTag) {
        const form = new Kernel.ActionFormData()
            .title("Edit Rank")
            .body("Select actions")
            .button("Basic Setting")
            .button("Basic Permission")
            .button("Admin Permission")
            .button("Land Permission")
            .button("Chest Shop Permission")
            .button("\u00A7c<= BACK")

        const res = await UIUtils.showForm(player, form)
        if (res.canceled) return

        // 4. Add a tick transition delay to the back button callback
        const back = () => {
            Kernel.system.runTimeout(() => {
                this.showEditRankActions(player, rankTag)
            }, 5)
        }

        switch (res.selection) {
            case 0: await showBasicSettings(player, rankTag, back); break
            case 1: await showBasicPermissions(player, rankTag, back); break
            case 2: await showAdminPermissions(player, rankTag, back); break
            case 3: await showLandPermissions(player, rankTag, back); break
            case 4: await showChestShopPermissions(player, rankTag, back); break
            case 5: 
                Kernel.system.runTimeout(() => {
                    this.showEditRanks(player)
                }, 5)
                break
        }
    }
}
