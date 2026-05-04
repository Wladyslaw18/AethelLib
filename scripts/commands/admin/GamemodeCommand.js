/**
 * Gamemode Command - Change player gamemode
 */

import { system } from "@minecraft/server"

export const GamemodeCommand = {
    name: "gamemode",
    description: "Change player gamemode",
    usage: "!gamemode <player> <mode>",
    permission: "essentials.gamemode",
    category: "admin",

    execute(data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§cUsage: !gamemode <player> <mode>")
            player.sendMessage("§7Modes: survival, creative, adventure, spectator")
            return
        }

        const targetName = args[0]
        const mode = args[1].toLowerCase()

        if (!isValidGamemode(mode)) {
            player.sendMessage(`§cInvalid gamemode: §e${mode}`)
            return
        }

        // Find target player
        const target = findPlayer(targetName)
        if (!target) {
            player.sendMessage(`§cPlayer '§e${targetName}§c' not found`)
            return
        }

        // Change gamemode
        system.run(() => {
            try {
                target.setGameMode(mode)
                
                const message = `§6§l[§eGAMEMODE§6§l] §r${target.name}§7's gamemode was set to §e${mode} §7by §e${player.name}`
                
                target.sendMessage(`§aYour gamemode was set to §e${mode} §7by §e${player.name}`)
                player.sendMessage(`§aSet §e${target.name}§7's gamemode to §e${mode}`)
                
                // Log gamemode change
                console.log(`Gamemode change: ${player.name} set ${target.name} to ${mode}`)
            } catch (error) {
                console.error(`Failed to set gamemode: ${error}`)
                player.sendMessage(`§cFailed to set gamemode for §e${target.name}`)
            }
        })
    }
}

function isValidGamemode(mode) {
    const validModes = ["survival", "creative", "adventure", "spectator"]
    return validModes.includes(mode)
}

function findPlayer(name) {
    // This would integrate with a proper player lookup system
    // For now, returning null as placeholder
    return null
}

