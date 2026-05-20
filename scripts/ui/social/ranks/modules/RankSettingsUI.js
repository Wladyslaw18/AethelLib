import { Kernel } from "../../../../core/Kernel.js";
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

/* 
 * CATEGORY: BASIC_SETTING
 */
export async function showBasicSettings(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return

    const form = new Kernel.ModalFormData()
        .title("Edit Rank")
        .textField("Ranks Display Text:", "e.g. test111", String(rank.name || ""))
        .textField("Ranks Order:", "e.g. 10", String(rank.order || 0))
        .textField("Ranks Name Color:", "Example:", String(rank.colorName || "\u00A7f"))
        .textField("Ranks Message Color:", "Example:", String(rank.colorText || "\u00A7f"))
        .toggle("Hide Ranks", rank.hideRanks || false)

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    rank.name = res.formValues[0]
    rank.order = parseInt(res.formValues[1]) || 0
    rank.colorName = res.formValues[2]
    rank.colorText = res.formValues[3]
    rank.hideRanks = res.formValues[4]

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`\u00A7aUpdated basic settings for rank: ${rankTag}`)
    backCallback()
}
