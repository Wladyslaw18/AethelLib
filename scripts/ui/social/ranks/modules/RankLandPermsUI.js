import { Kernel } from "../../../../core/Kernel.js";
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

export async function showLandPermissions(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return
    const p = rank.permissions || {}
    const options = ["\u00A7aAllow", "\u00A77No action (Default)", "\u00A7cDeny"]

    const nodes = [
        { label: "Land Claim Command", key: "land.claim" },
        { label: "Land Unclaim Command", key: "land.unclaim" },
        { label: "Land Invite Command", key: "land.invite" },
        { label: "Land Kick Command", key: "land.kick" },
        { label: "Land Transfer Ownership", key: "land.transfer" },
        { label: "Land Setting Command", key: "land.setting" }
    ]

    const form = new Kernel.ModalFormData().title("Land Permission")
    nodes.forEach(node => {
        let val = 1; // Default: No action (1)
        if (p[node.key] === true) val = 0;
        else if (p[node.key] === false) val = 2;
        
        form.dropdown(node.label, options, val)
    })
    form.textField("Land Claim Limit:", "1", String(p["limit.land"] || 1))

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
    rank.permissions["limit.land"] = parseInt(res.formValues[nodes.length]) || 1

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`\u00A7aUpdated land permissions for rank: ${rankTag}`)
    backCallback()
}
