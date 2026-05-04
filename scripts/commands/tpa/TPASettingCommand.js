/**
 * TPASetting Command - Configure TPA settings
 */

import { TPAStore } from "../../systems/tpa/TpaStore.js"

export const TPASettingCommand = {
    name: "tpasetting",
    description: "Configure your TPA settings",
    usage: "!tpasetting <on/off/ui>",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const option = args[0]?.toLowerCase()

        if (!option || (option !== "on" && option !== "off" && option !== "ui")) {
            const enabled = TPAStore.isEnabled(player.id)
            const uiEnabled = TPAStore.getUIToggle(player.id)

            player.sendMessage("§6=== TPA Settings ===")
            player.sendMessage(`§7Requests: ${enabled ? "§aEnabled" : "§cDisabled"}`)
            player.sendMessage(`§7Opt-in UI: ${uiEnabled ? "§aEnabled" : "§cDisabled"}`)
            player.sendMessage("")
            player.sendMessage("§eUsage: !tpasetting <on/off/ui>")
            return
        }

        if (option === "ui") {
            const current = TPAStore.getUIToggle(player.id)
            TPAStore.setUIToggle(player.id, !current)
            player.sendMessage(`§aOpt-in UI ${!current ? "enabled" : "disabled"}`)
            return
        }

        const enabled = option === "on"
        const success = await TPAStore.setSettings(player.id, { enabled })

        if (success) {
            player.sendMessage(`§aTPA requests ${enabled ? "enabled" : "disabled"}`)

            if (!enabled) {
                // Cancel all existing requests when disabling
                await TPAStore.cancelAllRequestsForPlayer(player.id)
                player.sendMessage("§7All existing TPA requests cancelled")
            }
        } else {
            player.sendMessage("§cFailed to update TPA settings")
        }
    }
}

