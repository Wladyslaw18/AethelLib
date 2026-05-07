/**
 * TPASetting Command - Configure TPA settings
 */

import { TPAStore } from "../../systems/tpa/TpaStore.js"

export const TPASettingCommand = {
    name: "tpasetting",
    description: "Configure your TPA settings",
    usage: "/ae:tpasetting <on/off/ui>",
    permission: "essentials.tpa",
    category: "teleport",
    parameters: [
        { name: "option", type: "string", optional: true }
    ],

    async execute(_data, player, args) {
        const option = args[0]?.toLowerCase()

        if (!option || (option !== "on" && option !== "off" && option !== "ui")) {
            const enabled = TPAStore.isEnabled(player.id)
            const uiEnabled = TPAStore.getUIToggle(player.id)

            player.sendMessage(" ")
            player.sendMessage("§6§lTPA Settings")
            player.sendMessage(`§7Requests: ${enabled ? "§aEnabled" : "§cDisabled"}`)
            player.sendMessage(`§7UI Pop-ups: ${uiEnabled ? "§aEnabled" : "§cDisabled"}`)
            player.sendMessage(" ")
            player.sendMessage("§eUsage: /ae:tpasetting <on/off/ui>")
            player.sendMessage(" ")
            return
        }


        if (option === "ui") {
            const current = TPAStore.getUIToggle(player.id)
            TPAStore.setUIToggle(player.id, !current)
            player.sendMessage(`§a§l» §fUI Pop-ups ${!current ? "§aEnabled" : "§cDisabled"}§f.`);
            return
        }


        const enabled = option === "on"
        const success = await TPAStore.setSettings(player.id, { enabled })

        if (success) {
            player.sendMessage(`§a§l» §fTPA requests ${enabled ? "§aEnabled" : "§cDisabled"}§f.`);


            if (!enabled) {
                // Cancel all existing requests when disabling
                await TPAStore.cancelAllRequestsForPlayer(player.id)
                player.sendMessage("§e§l» §7All existing TPA requests cancelled.");
            }
        } else {
            player.sendMessage("§c§l» §7Failed to update TPA settings.");
        }

    }
}

