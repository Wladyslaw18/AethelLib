import { TPAStore } from "../../systems/tpa/TpaStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: BlockCommand                                                     |
// | command definition for blacklisting specific players from TPA requests.    |
// | interfaces with the TPAStore to persist the block relationship.           |
// ----------------------------------------------------------------------------
export const BlockCommand = {
    // internal identifier.
    name: "block",
    // human-readable description.
    description: "Block a player from TPA requests",
    // syntax guide.
    usage: "/ae:block <player_name>",
    // required permission level.
    permission: "essentials.tpa",
    // command category.
    category: "teleport",
    // native parameter definitions.
    parameters: [
        { name: "player", type: "player", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the blacklist injection pipeline. handles target resolution and           |
    // | duplicate check before committing the block.                              |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax validation.
        if (args.length === 0) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:block <player_name>")
            player.sendMessage("\u00A7e\u00A7l» \u00A7fTip: \u00A77Blocked players cannot send you TPA requests.")
            return
        }

        // resolve the target player.
        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        // check if target is online (required for ID-based blocking).
        if (!target) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Player '${targetName}' not found or offline.`)
            return
        }

        // prevent self-blocking.
        if (target.id === player.id) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot block yourself!")
            return
        }

        // step 1: check for existing block record.
        const blocked = TPAStore.getBlocked(player.id)
        if (blocked.includes(target.id)) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77${target.name} is already blocked.`)
            return
        }

        // step 2: commit the block.
        // update the persistent store with the new relationship.
        TPAStore.blockPlayer(player.id, target.id)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fBlocked \u00A7e${target.name}\u00A7f from sending you TPA requests.`)
    }
}
