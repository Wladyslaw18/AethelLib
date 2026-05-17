import { ModalFormData } from "@minecraft/server-ui"
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

/* 
 * CATEGORY: BASIC_SETTING
 */
export async function showBasicSettings(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return

    const form = new ModalFormData()
        .title("Edit Rank")
        .textField("Ranks Display Text:", "e.g. test111", { defaultValue: String(rank.name || "") })
        .textField("Ranks Order:", "e.g. 10", { defaultValue: String(rank.order || 0) })
        .textField("Ranks Name Color:", "Example:", { defaultValue: String(rank.colorName || "\xA7f") })
        .textField("Ranks Message Color:", "Example:", { defaultValue: String(rank.colorText || "\xA7f") })
        .toggle("Hide Ranks", { defaultValue: rank.hideRanks || false })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    rank.name = res.formValues[0]
    rank.order = parseInt(res.formValues[1]) || 0
    rank.colorName = res.formValues[2]
    rank.colorText = res.formValues[3]
    rank.hideRanks = res.formValues[4]

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`\xA7aUpdated basic settings for rank: ${rankTag}`)
    backCallback()
}
