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
        player.sendMessage("§cNo permission.")
        return
    }

    const players = Kernel.world.getAllPlayers()
    const form = new ActionFormData()
        .title("§a§e§l§e§lPlayers Panel")
        .body(`§aPlayers Online : §f${players.length}`)

    players.forEach(p => form.button(`§e§l${p.name}`, "textures/items/totem"))
    form.button("§c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    if (res.selection === players.length) return await showAdminPanel(player)

    await showIndividualPlayerPanel(player, players[res.selection], () => showPlayerManagement(player))
}
