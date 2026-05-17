import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { showIndividualPlayerPanel } from "./player_modules/PlayerIndividualUI.js"
import { UIUtils } from "../../ui/UIUtils.js"

/**
 * Shows the Players List Panel
 */
export async function showPlayerManagement(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\xA7cNo permission.")
        return
    }

    const players = Kernel.world.getAllPlayers()
    const form = new ActionFormData()
        .title("\xA7a\xA7e\xA7l\xA7e\xA7lPlayers Panel")
        .body(`\xA7aPlayers Online : \xA7f${players.length}`)

    players.forEach(p => form.button(`\xA7e\xA7l${p.name}`, "textures/items/totem"))
    form.button("\xA7c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    if (res.selection === players.length) return await showAdminPanel(player)

    await showIndividualPlayerPanel(player, players[res.selection], () => showPlayerManagement(player))
}
