import { system, world } from "@minecraft/server"

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

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length < 2) {
            player.sendMessage("§c§l» §7Usage: /ae:gamemode <player> <mode>");
            player.sendMessage("§8- Modes: survival, creative, adventure, spectator");
            return
        }


        const targetName = args[0]
        const mode = args[1].toLowerCase()

        if (!isValidGamemode(mode)) {
            player.sendMessage(`§c§l» §7Invalid mode: '${mode}'`);
            return
        }


        /* 
         * ENTITY_RESOLUTION
         */
        const target = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        if (!target) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found.`);
            return
        }


        /* 
         * REALITY_MUTATION_HOOK
         */
        system.run(() => {
            try {
                target.setGameMode(mode)
                
                target.sendMessage(`§a§l» §fYour game mode was set to §e${mode}§f by §e${player.name}§f.`);
                player.sendMessage(`§a§l» §fSet §e${target.name}§f's game mode to §e${mode}§f.`);

                
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
