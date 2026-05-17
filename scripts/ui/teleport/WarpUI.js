import { ActionFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { CommandHandler } from "../../commands/base/CommandHandler.js"

/*
 * WARP_UI_CONTROLLER
 * ----------------------------------------------------------------------------
 * Visual interface for public waypoints.
 */

export async function showWarpUI(player) {
    const warps = await WarpStore.getWarps()
    const warpNames = Object.keys(warps)

    const form = new ActionFormData()
        .title(Lang.GOLD + "WAYPOINTS")
        .body(warpNames.length > 0 
            ? `\xA77Available Waypoints: \xA7e${warpNames.length}`
            : "\xA7cNO WAYPOINTS CONFIGURED.")

    form.button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

    for (const name of warpNames) {
        form.button(`\xA7f\xA7l${name.toUpperCase()}\n\xA78Public waypoint`, "textures/items/ender_eye")
    }

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    if (res.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        system.run(() => showMainGUI(player))
        return
    }

    const selectedName = warpNames[res.selection - 1]
    if (!selectedName) return

    // Execute Warp via command to handle cooldowns/permissions
    CommandHandler.executeCommand(player, `/ae:warp "${selectedName}"`)
}

