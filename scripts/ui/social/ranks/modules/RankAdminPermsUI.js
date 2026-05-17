import { ModalFormData } from "@minecraft/server-ui"
import { UIUtils } from "../../../UIUtils.js"
import { RankSystem } from "../../../../systems/social/ranks/RankSystem.js"

export async function showAdminPermissions(player, rankTag, backCallback) {
    const rank = RankSystem.getRank(rankTag)
    if (!rank) return
    const p = rank.permissions || {}
    // Reordered to match screenshot: 0 = No action, 1 = Allow, 2 = Deny
    const options = ["No action (Default)", "Allow", "Deny"]

    const nodes = [
        { label: "Admin Panel Command", key: "admin.panel" },
        { label: "Ban Command", key: "admin.ban" },
        { label: "Broadcast Command", key: "admin.broadcast" },
        { label: "Economy Command", key: "admin.economy" },
        { label: "Floatingtext Command", key: "admin.floatingtext" },
        { label: "Inventory See Command", key: "admin.invsee" },
        { label: "Kick Command", key: "admin.kick" },
        { label: "Land Setting Command", key: "admin.landsetting" },
        { label: "Log Command", key: "admin.log" },
        { label: "Mute Command", key: "admin.mute" },
        { label: "Ranks Command", key: "admin.ranks" },
        { label: "Reset Data Command", key: "admin.resetdata" },
        { label: "Sell Setting Command", key: "admin.sellsetting" },
        { label: "Setting Command", key: "admin.setting" },
        { label: "Shop Setting Command", key: "admin.shopsetting" },
        { label: "Warp Command", key: "admin.warp" },
        { label: "Teleport Command", key: "admin.tp" },
        { label: "Gamemode Creative Command", key: "admin.gm.c" },
        { label: "Gamemode Survival Command", key: "admin.gm.s" },
        { label: "Gamemode Spectator Command", key: "admin.gm.sp" },
        { label: "Gamemode Adventure Command", key: "admin.gm.a" }
    ]

    const form = new ModalFormData().title("Edit Ranks")
    nodes.forEach((node, index) => {
        let label = node.label
        if (index === 0) {
            label = "Allow/Deny player to use admin command\n\n" + label
        }
        
        // Mapping: if undefined -> 0 (No action). 
        // If it was stored with the old mapping (0=Allow, 1=NoAction, 2=Deny), we should ideally convert it.
        // For simplicity and matching screenshot, we'll assume the new indices.
        const val = p[node.key] === undefined ? 0 : p[node.key]
        form.dropdown(label, options, val)
    })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    nodes.forEach((node, index) => {
        rank.permissions[node.key] = res.formValues[index]
    })

    RankSystem.updateRank(rankTag, rank)
    player.sendMessage(`\xA7aUpdated admin permissions for rank: ${rankTag}`)
    backCallback()
}
