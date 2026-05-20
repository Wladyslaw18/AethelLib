import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: TPAHereCommand                                                   |
// | command definition for requesting another player to teleport TO you.       |
// | interfaces with the TPAService to manage the inverted handshake.          |
// ----------------------------------------------------------------------------
export const TPAHereCommand = {
    // internal name.
    name: "tpahere",
    // human-readable description.
    description: "Request another player to teleport to you",
    // syntax guide.
    usage: "/ae:tpahere <player_name>",
    // required permission node.
    permission: "essentials.tpa",
    // command category.
    category: "teleport",
    // native parameter definitions.
    parameters: [
        { name: "player", type: "player", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the handshake initialization vector for "here" requests. resolutions and |
    // | delegates to the TPA service.                                            |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax check.
        if (args.length === 0) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:tpahere <player>");
            return
        }

        // resolve the target entity.
        const targetName = args.join(" ")
        const targetPlayer = PlayerUtils.findPlayer(targetName)

        // check if target is online.
        if (!targetPlayer) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Player '${targetName}' not found.`);
            return
        }

        // self-request block.
        if (targetPlayer.id === player.id) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot send a TPA request to yourself.");
            return
        }

        // step 1: initialize handshake.
        // send a "tpahere" type request (target moves to sender).
        const TpaService = Kernel.get("tpaService")
        const success = TpaService.sendRequest(player, targetPlayer, "tpahere")

        if (success) {
            // confirmation output.
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fTPAHere request sent to \u00A7e${targetPlayer.name}\u00A7f.`);
        }
    }
}
