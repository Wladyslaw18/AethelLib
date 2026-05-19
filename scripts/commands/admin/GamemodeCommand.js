import { Kernel } from "../../core/Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: GamemodeCommand                                                  |
// | command definition for altering a player's game state (survival/creative).|
// ----------------------------------------------------------------------------
export const GamemodeCommand = {
    // internal name.
    name: "gamemode",
    // human-readable description.
    description: "Change a player's game mode",
    // syntax guide.
    usage: "/ae:gamemode <player_identifier> <mode_token>",
    // required permission node.
    permission: "essentials.gamemode",
    // command category.
    category: "Admin",
    // native parameter definitions.
    parameters: [
        { name: "player", type: "player", optional: false },
        { name: "mode",   type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | processes the gamemode change request.                                   |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // basic input validation.
        if (args.length < 2) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:gamemode <player> <mode>");
            player.sendMessage("\xA78- Modes: survival, creative, adventure, spectator");
            return
        }

        // resolve inputs.
        // the last argument is always the mode token (e.g. 'creative').
        const modeToken = args[args.length - 1].toLowerCase()
        // everything before the last argument is treated as the player name (handles spaces).
        const nameArgs = args.slice(0, args.length - 1)
        const targetName = nameArgs.join(" ")
        
        // check if the requested mode is actually valid.
        if (!isValidGamemode(modeToken)) {
            player.sendMessage(`\xA7c\xA7l» \xA77Invalid mode: '\xA7e${modeToken}\xA77'. Use: survival, creative, adventure, spectator`);
            return
        }

        // find the target player object.
        const target = PlayerUtils.findPlayer(targetName)
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '\xA7e${targetName}\xA77' not found or is offline.`);
            return
        }

        // reality mutation hook.
        // we use Kernel.system.run to execute the change outside the current tick's event loop.
        Kernel.system.run(() => {
            try {
                // map the string tokens to the native engine Kernel.GameMode enum.
                const modeMap = {
                    "survival": Kernel.GameMode.Survival,
                    "creative": Kernel.GameMode.Creative,
                    "adventure": Kernel.GameMode.Adventure,
                    "spectator": Kernel.GameMode.Spectator
                }
                
                // execute the change on the player entity.
                target.setGameMode(modeMap[modeToken] || Kernel.GameMode.Survival)
                
                // notify both the target and the sender.
                target.sendMessage(`\xA7a\xA7l» \xA7fYour game mode was set to \xA7e${modeToken}\xA7f by \xA7e${player.name}\xA7f.`);
                player.sendMessage(`\xA7a\xA7l» \xA7fSet \xA7e${target.name}\xA7f's game mode to \xA7e${modeToken}\xA7f.`);

            } catch (error) {
                // log and notify if the change fails.
                player.sendMessage(`\xA7c\xA7l» \xA77Failed to change game mode for '${target.name}'.`);
            }
        })
    }
}

// ----------------------------------------------------------------------------
// | function: isValidGamemode                                                |
// | checks if the provided string is one of the 4 supported bedrock modes.   |
// ----------------------------------------------------------------------------
function isValidGamemode(mode) {
    const validModes = ["survival", "creative", "adventure", "spectator"]
    return validModes.includes(mode)
}
