import { ActionFormData } from "@minecraft/server-ui"
import { world, system } from "@minecraft/server"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * PLAYER_MANIFEST_UI
 */

export async function showPlayersUI(player) {
    const players = [...world.getAllPlayers()]
    const form = new ActionFormData()
        .title(Lang.UI.PLAYERS_TITLE)
        .body(Lang.format(Lang.UI.PLAYERS_BODY, { count: players.length }))

    players.forEach(p => {
        form.button(`§f§l${p.name}\n§8ID: ${p.id.slice(0,8)}`, "textures/ui/multiplayer_glyph_color")
    })
    form.button("§c§l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        const { showMainGUI } = await import("../MainGUI.js")
        system.run(() => showMainGUI(player))
        return
    }

    const target = players[res.selection]
    const { showPlayerInteractionUI } = await import("./PlayerActionUI.js")
    system.run(() => showPlayerInteractionUI(player, target))
}
