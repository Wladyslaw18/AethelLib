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

    const form = new Kernel.ModalFormData()
        .title("\xA77\xA7l⚙️ Settings")
        .toggle("\xA7eTPA Requests", { defaultValue: tpaEnabled })
        .toggle("\xA76Scoreboard Visible", { defaultValue: scoreboardVisible })

    // @ts-ignore
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

    player.sendMessage("\xA7aSettings saved!")
    player.sendMessage(`\xA77TPA: ${newTpa ? "\xA7aEnabled" : "\xA7cDisabled"} \xA77| Scoreboard: ${newScoreboard ? "\xA7aVisible" : "\xA7cHidden"}`)
}
