/**
 * Unban Command - Unban a player
 */

import { world } from "@minecraft/server"

export const UnbanCommand = {
    name: "unban",
    description: "Unban a player",
    usage: "!unban <playerName>",
    permission: "essentials.admin.ban",
    category: "admin",

    execute(data, player, args) {
        if (args.length < 1) {
            player.sendMessage("§cUsage: !unban <playerName>")
            return
        }

        const playerName = args[0]
        
        try {
            const bans = getBans()
            const banIndex = bans.findIndex(ban => ban.playerName === playerName)
            
            if (banIndex === -1) {
                player.sendMessage(`§cNo ban record found for '${playerName}'`)
                return
            }

            const ban = bans[banIndex]
            bans.splice(banIndex, 1)
            
            world.setDynamicProperty("ae:bans", JSON.stringify(bans))
            
            player.sendMessage(`§aSuccessfully unbanned ${playerName}`)
            
            // Log the unban for admins
            const unbanMessage = `§6§l[§eUNBAN§6§l] §r${playerName} §7was unbanned by §e${player.name}`
            world.getPlayers().forEach(p => {
                if (p.hasTag("admin") || p === player) {
                    p.sendMessage(unbanMessage)
                }
            })
            
        } catch (error) {
            console.error(`Failed to unban ${playerName}: ${error}`)
            player.sendMessage("§cFailed to unban player")
        }
    }
}

function getBans() {
    try {
        const stored = world.getDynamicProperty("ae:bans")
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error(`Failed to load bans: ${error}`)
        return []
    }
}

