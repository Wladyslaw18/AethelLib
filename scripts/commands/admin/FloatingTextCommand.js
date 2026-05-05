/**
 * Floating Text Command - Manage floating text
 */

import { FloatingTextStore } from "../../systems/floatingtext/FloatingTextStore.js"
import { spawnFloatingText, removeFloatingText, clearAll } from "../../systems/floatingtext/FloatingTextService.js"

export const FloatingTextCommand = {
    name: "ft",
    description: "Manage floating text",
    usage: "!ft <add/remove/clear> [text]",
    permission: "essentials.admin.ft",
    category: "admin",

    async execute(_data, player, args) {
        const sub = args[0]?.toLowerCase()
        
        if (!sub) {
            player.sendMessage("§cUsage: !ft <add/remove/clear> [text]")
            return
        }

        switch (sub) {
            case "add":
                const text = args.slice(1).join(" ")
                if (!text) {
                    player.sendMessage("§cUsage: !ft add <text>")
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
                    player.sendMessage(`§aFloating text added with ID: ${id}`)
                } else {
                    player.sendMessage("§cFailed to add floating text")
                }
                break
                
            case "remove":
                const removeId = args[1]
                if (!removeId) {
                    player.sendMessage("§cUsage: !ft remove <id>")
                    return
                }
                
                const success = FloatingTextStore.remove(removeId)
                if (success) {
                    removeFloatingText(removeId)
                    player.sendMessage(`§aFloating text removed`)
                } else {
                    player.sendMessage("§cFailed to remove floating text")
                }
                break
                
            case "clear":
                const clearSuccess = FloatingTextStore.clear()
                if (clearSuccess) {
                    clearAll()
                    player.sendMessage(`§aAll floating texts cleared`)
                } else {
                    player.sendMessage("§cFailed to clear floating texts")
                }
                break
                
            default:
                player.sendMessage("§cUsage: !ft <add/remove/clear> [text]")
        }
    }
}

