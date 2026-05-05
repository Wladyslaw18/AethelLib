import { ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"

/**
 * Show player settings UI
 * @param {import("@minecraft/server").Player} player
 */
export async function showSettingsUI(player) {
    const PlayerStore = Kernel.get("playerStore")

    // Load current settings
    const tpaEnabled = PlayerStore.get(player, "settings:tpa") !== false
    const scoreboardVisible = PlayerStore.get(player, "settings:scoreboard") !== false

    const form = new ModalFormData()
        .title("§7§l⚙️ Settings")
        .toggle("§eTPA Requests", { defaultValue: tpaEnabled })
        .toggle("§6Scoreboard Visible", { defaultValue: scoreboardVisible })

    const response = await form.show(player)
    if (response.canceled) return

    const newTpa = Boolean(response.formValues[0])
    const newScoreboard = Boolean(response.formValues[1])

    // Save settings
    PlayerStore.set(player, "settings:tpa", newTpa)
    PlayerStore.set(player, "settings:scoreboard", newScoreboard)

    // Apply scoreboard visibility
    if (!newScoreboard) {
        try {
            const objective = Kernel.world.scoreboard.getObjective("money")
            if (objective) {
                objective.setScore(player, 0)
            }
        } catch { /* ignore */ }
    }

    player.sendMessage("§aSettings saved!")
    player.sendMessage(`§7TPA: ${newTpa ? "§aEnabled" : "§cDisabled"} §7| Scoreboard: ${newScoreboard ? "§aVisible" : "§cHidden"}`)
}
