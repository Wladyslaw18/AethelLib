/**
 * TPA Settings Command - Toggle TPA mode
 * Smith Forge Rule: Max 100 lines per file
 */

import { TPAStore } from "../../systems/tpa/TpaStore.js"

export const TPASettingsCommand = {
    name: "tpasettings",
    description: "Toggle TPA mode (popup/chat/off)",
    usage: "!tpasettings <mode>",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(data, player, args) {
        const newMode = args[0]?.toLowerCase()
        const currentMode = TPAStore.getMode(player.id)
        
        if (!newMode) {
            player.sendMessage(`§aCurrent TPA mode: §e${currentMode}§a`)
            player.sendMessage("§7Modes: §apopup§7, §achat§7, §coff§7")
            player.sendMessage("§7Usage: !tpasettings <mode>")
            return
        }

        if (!["popup", "chat", "off"].includes(newMode)) {
            player.sendMessage("§cInvalid mode! Use: popup, chat, or off")
            return
        }

        TPAStore.setMode(player.id, newMode)
        player.sendMessage(`§aTPA mode set to §e${newMode}§a!`)
    }
}

