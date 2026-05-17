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
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:block <player_name>")
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Blocked players cannot send you TPA requests.")
            return
        }

        // resolve the target player.
        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        // check if target is online (required for ID-based blocking).
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${targetName}' not found or offline.`)
            return
        }

        // prevent self-blocking.
        if (target.id === player.id) {
            player.sendMessage("\xA7c\xA7l» \xA77You cannot block yourself!")
            return
        }

        // step 1: check for existing block record.
        const blocked = TPAStore.getBlocked(player.id)
        if (blocked.includes(target.id)) {
            player.sendMessage(`\xA7c\xA7l» \xA77${target.name} is already blocked.`)
            return
        }

        // step 2: commit the block.
        // update the persistent store with the new relationship.
        TPAStore.blockPlayer(player.id, target.id)
        player.sendMessage(`\xA7a\xA7l» \xA7fBlocked \xA7e${target.name}\xA7f from sending you TPA requests.`)
    }
}
