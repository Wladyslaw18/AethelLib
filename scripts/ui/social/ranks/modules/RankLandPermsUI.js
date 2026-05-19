import { Kernel } from "../../../../core/Kernel.js";
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

export async function showLandPermissions(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return
    const p = rank.permissions || {}
    const options = ["\xA7aAllow", "\xA77No action (Default)", "\xA7cDeny"]

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
        const val = p[node.key] === undefined ? 1 : p[node.key]
        form.dropdown(node.label, options, val)
    })
    form.textField("Land Claim Limit:", "1", String(p["limit.land"] || 1))

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    nodes.forEach((node, index) => {
        rank.permissions[node.key] = res.formValues[index]
    })
    rank.permissions["limit.land"] = parseInt(res.formValues[nodes.length]) || 1

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`\xA7aUpdated land permissions for rank: ${rankTag}`)
    backCallback()
}
