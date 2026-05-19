import { Kernel } from "../../core/Kernel.js";

// ----------------------------------------------------------------------------
// | object: GamemodeCommand                                                  |
// | alters a player's reality (survival/creative).                          |
// | native C++ type-safety. no more string token slicing or regex loops.    |
// ----------------------------------------------------------------------------
export const GamemodeCommand = {
    name: "gamemode",
    description: "Change a player's game mode",
    usage: "/ae:gamemode <player> <mode>",
    permission: "essentials.gamemode",
    category: "Admin",
    
    // NATIVE SCHEMA DEFINITION: direct bindings!
    params: [
        { name: "player", type: Kernel.CustomCommandParamType.PlayerSelector, optional: false },
        { name: "mode",   type: Kernel.CustomCommandParamType.String, optional: false }
    ],

    execute(_data, player, args) {
        // target is an actual Player object! mode is a C++ validated String!
        const [target, mode] = args;

        if (!target || !mode) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:gamemode <player> <mode>");
            player.sendMessage("\xA78- Modes: survival, creative, adventure, spectator");
            return;
        }

        const modeToken = mode.toLowerCase();
        
        // check if requested mode exists.
        if (!isValidGamemode(modeToken)) {
            player.sendMessage(`\xA7c\xA7l» \xA77Invalid mode: '\xA7e${modeToken}\xA77'. Use: survival, creative, adventure, spectator`);
            return;
        }

        // execute outside the current event tick.
        Kernel.system.run(() => {
            try {
                // map the string tokens to the native engine Kernel.GameMode enum.
                const modeMap = {
                    "survival": Kernel.GameMode.Survival,
                    "creative": Kernel.GameMode.Creative,
                    "adventure": Kernel.GameMode.Adventure,
                    "spectator": Kernel.GameMode.Spectator
                }
                
                target.setGameMode(modeMap[modeToken] || Kernel.GameMode.Survival)
                
                target.sendMessage(`\xA7a\xA7l» \xA7fYour game mode was set to \xA7e${modeToken}\xA7f by \xA7e${player.name}\xA7f.`);
                player.sendMessage(`\xA7a\xA7l» \xA7fSet \xA7e${target.name}\xA7f's game mode to \xA7e${modeToken}\xA7f.`);
            } catch (error) {
                player.sendMessage(`\xA7c\xA7l» \xA77Failed to change game mode for '${target.name}'.`);
            }
        })
    }
}

function isValidGamemode(mode) {
    const validModes = ["survival", "creative", "adventure", "spectator"]
    return validModes.includes(mode)
}
