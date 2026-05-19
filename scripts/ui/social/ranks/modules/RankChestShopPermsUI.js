import { Kernel } from "../../../../core/Kernel.js";
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

export async function showChestShopPermissions(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return
    const p = rank.permissions || {}
    const options = ["\xA7aAllow", "\xA77No action (Default)", "\xA7cDeny"]

    const nodes = [
        { label: "Chest Shop Create (Selling)", key: "chestshop.create.sell" },
        { label: "Chest Shop Create (Buying)", key: "chestshop.create.buy" },
        { label: "Chest Shop Sell", key: "chestshop.sell" },
        { label: "Chest Shop Buy", key: "chestshop.buy" }
    ]

    const form = new Kernel.ModalFormData().title("Chest Shop Perm")
    nodes.forEach(node => {
        const val = p[node.key] === undefined ? 1 : p[node.key]
        form.dropdown(node.label, options, val)
    })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    nodes.forEach((node, index) => {
        rank.permissions[node.key] = res.formValues[index]
    })

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`\xA7aUpdated chest shop permissions for rank: ${rankTag}`)
    backCallback()
}
