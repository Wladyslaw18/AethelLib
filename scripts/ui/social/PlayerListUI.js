import { Kernel } from "../../core/Kernel.js";
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * PLAYER_MANIFEST_UI
 */

export async function showPlayersUI(player) {
    const players = [...world.getAllPlayers()]
    const form = new Kernel.ActionFormData()
        .title(Lang.UI.PLAYERS_TITLE)
        .body(Lang.format(Lang.UI.PLAYERS_BODY, { count: players.length }))

    players.forEach(p => {
        form.button(`\u00A7f\u00A7l${p.name}\n\u00A78ID: ${p.id.slice(0,8)}`, "textures/ui/multiplayer_glyph_color")
    })
    form.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        const { showMainGUI } = await import("../MainGUI.js")
        Kernel.system.run(() => showMainGUI(player))
        return
    }

    const target = players[res.selection]
    const { showPlayerInteractionUI } = await import("./PlayerActionUI.js")
    Kernel.system.run(() => showPlayerInteractionUI(player, target))
}
