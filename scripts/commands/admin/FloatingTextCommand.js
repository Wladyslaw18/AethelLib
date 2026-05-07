/**
 * Floating Text Command - Manage floating text
 */

import { FloatingTextStore } from "../../systems/floatingtext/FloatingTextStore.js"
import { spawnFloatingText, removeFloatingText, clearAll } from "../../systems/floatingtext/FloatingTextService.js"

export const FloatingTextCommand = {
    name: "ft",
    description: "Manage floating text displays",

    usage: "/ae:ft <add/remove/clear> [text]",
    permission: "essentials.admin.ft",
    category: "admin",

    async execute(_data, player, args) {
        const sub = args[0]?.toLowerCase()
        
        if (!sub) {
            player.sendMessage("§c§l» §7Usage: /ae:ft <add|remove|clear> [text]");
            return
        }


        switch (sub) {
            case "add":
                const text = args.slice(1).join(" ")
                if (!text) {
                    player.sendMessage("§c§l» §7Usage: /ae:ft add <text>");
                    return
                }

                
                const entry = {
                    text,
                    x: Math.floor(player.location.x),
                    y: Math.floor(player.location.y) + 1,
                    z: Math.floor(player.location.z),
                    dimension: player.dimension.id
                }
                
                const id = FloatingTextStore.add(entry)
                if (id) {
                    spawnFloatingText(entry)
                    player.sendMessage(`§a§l» §fFloating text added (ID: §e${id}§f).`);
                } else {
                    player.sendMessage("§c§l» §7Failed to add floating text.");
                }

                break
                
            case "remove":
                const removeId = args[1]
                if (!removeId) {
                    player.sendMessage("§c§l» §7Usage: /ae:ft remove <id>");
                    return
                }

                
                const success = FloatingTextStore.remove(removeId)
                if (success) {
                    removeFloatingText(removeId)
                    player.sendMessage("§a§l» §fFloating text removed.");
                } else {
                    player.sendMessage("§c§l» §7Failed to remove floating text.");
                }

                break
                
            case "clear":
                const clearSuccess = FloatingTextStore.clear()
                if (clearSuccess) {
                    clearAll()
                    player.sendMessage("§a§l» §fAll floating texts cleared.");
                } else {
                    player.sendMessage("§c§l» §7Failed to clear floating texts.");
                }

                break
                
            default:
                player.sendMessage("§cUsage: /ae:ft <add/remove/clear> [text]")
        }
    }
}

