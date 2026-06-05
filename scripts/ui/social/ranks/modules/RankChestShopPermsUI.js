import { Kernel } from "../../../../core/Kernel.js";
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

export async function showChestShopPermissions(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return
    const p = rank.permissions || {}
    const options = ["\u00A7aAllow", "\u00A77No action (Default)", "\u00A7cDeny"]

    const nodes = [
        { label: "Chest Shop Create (Selling)", key: "chestshop.create.sell" },
        { label: "Chest Shop Create (Buying)", key: "chestshop.create.buy" },
        { label: "Chest Shop Sell", key: "chestshop.sell" },
        { label: "Chest Shop Buy", key: "chestshop.buy" }
    ]

    const form = new Kernel.ModalFormData().title("Chest Shop Perm")
    nodes.forEach(node => {
        let val = 1; // Default: No action (1)
        if (p[node.key] === true) val = 0;
        else if (p[node.key] === false) val = 2;
        
        form.dropdown(node.label, options, val)
    })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    nodes.forEach((node, index) => {
        const selection = res.formValues[index]
        if (selection === 0) {
            rank.permissions[node.key] = true
        } else if (selection === 2) {
            rank.permissions[node.key] = false
        } else {
            delete rank.permissions[node.key]
        }
    })

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`\u00A7aUpdated chest shop permissions for rank: ${rankTag}`)
    backCallback()
}
