import { system, GameMode } from "@minecraft/server"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

/*
 * Gamemode Command
 * ----------------------------------------------------------------------------
 * Handles changing a player's game mode.
 */

export const GamemodeCommand = {
    name: "gamemode",
    description: "Change a player's game mode",

    usage: "/ae:gamemode <player_identifier> <mode_token>",
    permission: "essentials.gamemode",
    category: "Admin",
    parameters: [
        { name: "player", type: "player", optional: false },
        { name: "mode",   type: "string", optional: true }
    ],

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:gamemode <player> <mode>");
            player.sendMessage("§8- Modes: survival, creative, adventure, spectator");
            return
        }

        // Resolve player — the last arg is always the mode token
        // Strategy: try args[0] as player, args[last] as mode
        const modeToken = args[args.length - 1].toLowerCase()
        const nameArgs = args.slice(0, args.length - 1)
        const targetName = nameArgs.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        if (!isValidGamemode(modeToken)) {
            player.sendMessage(`§c§l» §7Invalid mode: '§e${modeToken}§7'. Use: survival, creative, adventure, spectator`);
            return
        }

        if (!target) {
            player.sendMessage(`§c§l» §7Player '§e${targetName}§7' not found or is offline.`);
            return
        }


        /* 
         * REALITY_MUTATION_HOOK
         */
        system.run(() => {
            try {
                const modeMap = {
                    "survival": GameMode.survival,
                    "creative": GameMode.creative,
                    "adventure": GameMode.adventure,
                    "spectator": GameMode.spectator
                }
                target.setGameMode(modeMap[modeToken] || GameMode.survival)
                
                target.sendMessage(`§a§l» §fYour game mode was set to §e${modeToken}§f by §e${player.name}§f.`);
                player.sendMessage(`§a§l» §fSet §e${target.name}§f's game mode to §e${modeToken}§f.`);

                
            } catch (error) {
                player.sendMessage(`§c§l» §7Failed to change game mode for '${target.name}'.`);
            }

        })
    }
}

/* 
 * MODE_MANIFEST_VALIDATOR
 */
function isValidGamemode(mode) {
    const validModes = ["survival", "creative", "adventure", "spectator"]
    return validModes.includes(mode)
}

