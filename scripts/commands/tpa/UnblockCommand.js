import { TPAStore } from "../../systems/tpa/TpaStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: UnblockCommand                                                   |
// | command definition for restoring TPA privileges to a previously blocked   |
// | player. purges the record from the TPAStore blacklist.                   |
// ----------------------------------------------------------------------------
export const UnblockCommand = {
    // internal name.
    name: "unblock",
    // human-readable description.
    description: "Unblock a player from TPA requests",
    // syntax guide.
    usage: "/ae:unblock <player_name>",
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
    // | the blacklist removal pipeline. handles resolution and existence check   |
    // | before purging the relationship.                                         |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // syntax check.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:unblock <player_name>")
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Unblocking allows that player to send TPA requests again.")
            return
        }

        // resolve the target entity.
        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        // target must be online to retrieve their unique ID.
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '\xA7e${targetName}\xA77' not found or not online.`)
            return
        }

        // step 1: check if they are actually blocked.
        const blocked = TPAStore.getBlocked(player.id)
        if (!blocked.includes(target.id)) {
            player.sendMessage(`\xA7c\xA7l» \xA77${target.name} is not in your block list.`)
            return
        }

        // step 2: purge the block record.
        TPAStore.unblockPlayer(player.id, target.id)
        player.sendMessage(`\xA7a\xA7l» \xA7fUnblocked \xA7e${target.name}\xA7f from sending you TPA requests.`)
    }
}
