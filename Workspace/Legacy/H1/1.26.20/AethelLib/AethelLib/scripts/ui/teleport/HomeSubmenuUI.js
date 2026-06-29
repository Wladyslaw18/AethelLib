import { ActionFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * HOME_SUBMENU_HUB
 */

export async function showHomeMenu(player) {
    const form = new ActionFormData()
        .title(Lang.UI.HOMES_TITLE)
        .body(Lang.UI.HOMES_BODY)
        .button(Lang.UI.HOMES_LIST, "textures/items/compass_item")
        .button(Lang.UI.HOMES_CREATE, "textures/items/map_empty")
        .button(Lang.UI.HOMES_DELETE, "textures/ui/cancel")
        .button("§c§l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === 3) {
        const { showMainGUI } = await import("../MainGUI.js")
        system.run(() => showMainGUI(player))
        return
    }

    switch (res.selection) {
        case 0: {
            const { showHomeUI } = await import("./HomeUI.js")
            system.run(() => showHomeUI(player))
            break
        }
        case 1: {
            const { showCreateHomeUI } = await import("./HomeActionUI.js")
            system.run(() => showCreateHomeUI(player))
            break
        }
        case 2: {
            const { showDeleteHomeUI } = await import("./HomeActionUI.js")
            system.run(() => showDeleteHomeUI(player))
            break
        }
    }
}

