import { ModalFormData } from "@minecraft/server-ui"
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

export async function showBasicPermissions(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return
    const p = rank.permissions || {}

    const form = new ModalFormData()
        .title("Edit Ranks")
        .textField("For Permission:\nLeave blank to use default permission\n\nChat Cooldown", "Input number here", { defaultValue: String(p["cooldown.chat"] || "") })
        .textField("Back Cooldown", "Input number here", { defaultValue: String(p["cooldown.back"] || "") })
        .textField("TPA Cooldown", "Input number here", { defaultValue: String(p["cooldown.tpa"] || "") })
        .textField("Home Cooldown", "Input number here", { defaultValue: String(p["cooldown.home"] || "") })
        .textField("Warp Cooldown", "Input number here", { defaultValue: String(p["cooldown.warp"] || "") })
        .textField("RTP Cooldown", "Input number here", { defaultValue: String(p["cooldown.rtp"] || "") })
        .textField("Command Cooldown", "Input number here", { defaultValue: String(p["cooldown.command"] || "") })
        .textField("Back Cost", "Input number here", { defaultValue: String(p["cost.back"] || "") })
        .textField("TPA Cost", "Input number here", { defaultValue: String(p["cost.tpa"] || "") })
        .textField("Home Cost", "Input number here", { defaultValue: String(p["cost.home"] || "") })
        .textField("Warp Cost", "Input number here", { defaultValue: String(p["cost.warp"] || "") })
        .textField("RTP Cost", "Input number here", { defaultValue: String(p["cost.rtp"] || "") })
        .textField("Home Limit", "Input number here", { defaultValue: String(p["limit.home"] || "3") })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    const keys = [
        "cooldown.chat", "cooldown.back", "cooldown.tpa", "cooldown.home", 
        "cooldown.warp", "cooldown.rtp", "cooldown.command",
        "cost.back", "cost.tpa", "cost.home", "cost.warp", "cost.rtp", "limit.home"
    ]

    keys.forEach((key, index) => {
        const valStr = String(res.formValues[index]).trim()
        if (valStr === "") {
            delete rank.permissions[key]
        } else {
            const parsed = parseFloat(valStr)
            rank.permissions[key] = isNaN(parsed) ? 0 : parsed
        }
    })

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`§aUpdated basic permissions for rank: ${rankTag}`)
    backCallback()
}
