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
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:gamemode <player> <mode>");
            player.sendMessage("\u00A78- Modes: survival, creative, adventure, spectator");
            return;
        }

        const modeToken = mode.toLowerCase();
        
        // check if requested mode exists.
        if (!isValidGamemode(modeToken)) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Invalid mode: '\u00A7e${modeToken}\u00A77'. Use: survival, creative, adventure, spectator`);
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
                
                target.sendMessage(`\u00A7a\u00A7l» \u00A7fYour game mode was set to \u00A7e${modeToken}\u00A7f by \u00A7e${player.name}\u00A7f.`);
                player.sendMessage(`\u00A7a\u00A7l» \u00A7fSet \u00A7e${target.name}\u00A7f's game mode to \u00A7e${modeToken}\u00A7f.`);
            } catch (error) {
                player.sendMessage(`\u00A7c\u00A7l» \u00A77Failed to change game mode for '${target.name}'.`);
            }
        })
    }
}

function isValidGamemode(mode) {
    const validModes = ["survival", "creative", "adventure", "spectator"]
    return validModes.includes(mode)
}
