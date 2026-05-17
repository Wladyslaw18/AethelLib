import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
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
        const form = new ModalFormData()
            .title("Add Rank")
            .textField("Rank Tag (Unique ID):", "e.g. vip")
            .textField("Display Text:", "e.g. \xA7b[VIP]")

        const res = await UIUtils.showForm(player, form)
        if (res.canceled) return

        const [tag, name] = res.formValues
        if (!tag) return player.sendMessage("\xA7cInvalid Rank Tag.")

        if (RankSystem.createRank(tag, { name: name || tag, order: 0, colorText: "\xA7f", colorName: "\xA7f", hideRanks: false, permissions: {} })) {
            player.sendMessage(`\xA7aSuccessfully created rank: ${tag}`)
            this.showEditRankActions(player, tag)
        } else {
            player.sendMessage("\xA7cFailed to create rank. Tag may already exist.")
        }
    }

    static async showEditRanks(player) {
        const ranks = RankSystem.getAllRanks()
        const rankIds = Object.keys(ranks)
        if (rankIds.length === 0) return player.sendMessage("\xA7cNo ranks found.")

        const form = new ModalFormData()
            .title("Edit Ranks")
            .dropdown("Select Ranks", rankIds.map(id => ranks[id].name || id))

        const res = await UIUtils.showForm(player, form)
        if (!res.canceled) this.showEditRankActions(player, rankIds[res.formValues[0]])
    }

    static async showEditRankActions(player, rankTag) {
        const form = new ActionFormData()
            .title("Edit Rank")
            .body("Select actions")
            .button("Basic Setting")
            .button("Basic Permission")
            .button("Admin Permission")
            .button("Land Permission")
            .button("Chest Shop Permission")
            .button("\xA7c<= BACK")

        const res = await UIUtils.showForm(player, form)
        if (res.canceled) return

        const back = () => this.showEditRankActions(player, rankTag)
        switch (res.selection) {
            case 0: await showBasicSettings(player, rankTag, back); break
            case 1: await showBasicPermissions(player, rankTag, back); break
            case 2: await showAdminPermissions(player, rankTag, back); break
            case 3: await showLandPermissions(player, rankTag, back); break
            case 4: await showChestShopPermissions(player, rankTag, back); break
            case 5: this.showEditRanks(player); break
        }
    }
}
