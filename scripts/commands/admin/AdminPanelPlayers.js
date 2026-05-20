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
        player.sendMessage("\u00A7cNo permission.")
        return
    }

    const players = Kernel.world.getAllPlayers()
    const form = new Kernel.ActionFormData()
        .title("\u00A7a\u00A7e\u00A7l\u00A7e\u00A7lPlayers Panel")
        .body(`\u00A7aPlayers Online : \u00A7f${players.length}`)

    players.forEach(p => form.button(`\u00A7e\u00A7l${p.name}`, "textures/items/totem"))
    form.button("\u00A7c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    if (res.selection === players.length) return await showAdminPanel(player)

    await showIndividualPlayerPanel(player, players[res.selection], () => showPlayerManagement(player))
}
