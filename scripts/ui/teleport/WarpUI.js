import { Kernel } from "../../core/Kernel.js";
import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { CommandHandler } from "../../commands/base/CommandHandler.js"

/*
 * WARP_UI_CONTROLLER
 * ----------------------------------------------------------------------------
 * Visual interface for public waypoints.
 */

export async function showWarpUI(player, onBack) {
    const warps = await WarpStore.getWarps()
    const warpNames = Object.keys(warps)

    const form = new Kernel.ActionFormData()
        .title(Lang.GOLD + "WAYPOINTS")
        .body(warpNames.length > 0 
            ? `\u00A77Available Waypoints: \u00A7e${warpNames.length}`
            : "\u00A7cNO WAYPOINTS CONFIGURED.")

    form.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    for (const name of warpNames) {
        form.button(`\u00A7f\u00A7l${name.toUpperCase()}\n\u00A78Public waypoint`, "textures/items/ender_eye")
    }

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    if (res.selection === 0) {
        if (onBack) {
            Kernel.system.run(() => onBack(player))
        }
        return
    }

    const selectedName = warpNames[res.selection - 1]
    if (!selectedName) return

    // Execute Warp via command to handle cooldowns/permissions
    CommandHandler.executeCommand(player, `/ae:warp "${selectedName}"`)
}

