import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: TPACommand                                                       |
// | command definition for requesting permission to teleport TO another player.|
// | interfaces with the TPAService to manage the handshake lifecycle.         |
// ----------------------------------------------------------------------------
export const TPACommand = {
    // internal name.
    name: "tpa",
    // human-readable description.
    description: "Request to teleport to another player",
    // syntax guide.
    usage: "/ae:tpa <player_name>",
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
    // | the handshake initialization vector. resolves the target and triggers    |
    // | the request logic in the TPA service.                                   |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // basic syntax check.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:tpa <player_name>")
            return
        }

        // resolve the target player object.
        const targetName = args.join(" ")
        const targetPlayer = PlayerUtils.findPlayer(targetName)

        // check if target is online.
        if (!targetPlayer) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${targetName}' not found or offline.`)
            return
        }

        // check for self-request block.
        if (targetPlayer.id === player.id) {
            player.sendMessage("\xA7c\xA7l» \xA77You cannot send a TPA request to yourself.")
            return
        }

        // step 1: initialize handshake.
        // resolve the service from the kernel and send a "to" type request.
        const TpaService = Kernel.get("tpaService")
        const success = TpaService.sendRequest(player, targetPlayer, "tpa")

        if (success) {
            // notify the sender that the request is out. 
            // the service handles notifying the receiver.
            player.sendMessage(`\xA7a\xA7l» \xA7fTPA request sent to \xA7e${targetPlayer.name}\xA7f.`)
        }
    }
}
