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
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:unblock <player_name>")
            player.sendMessage("\u00A7e\u00A7l» \u00A7fTip: \u00A77Unblocking allows that player to send TPA requests again.")
            return
        }

        // FIX: Resolve rich target player objects from autocomplete OR strings
        const target = typeof args[0] === 'object' && args[0] !== null
            ? args[0]
            : PlayerUtils.findPlayer(args.join(" "))

        // target must be online to retrieve their unique ID.
        if (!target) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Player not found or not online.`)
            return
        }

        // step 1: check if they are actually blocked.
        const blocked = TPAStore.getBlocked(player.id)
        if (!blocked.includes(target.id)) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77${target.name} is not in your block list.`)
            return
        }

        // step 2: purge the block record.
        TPAStore.unblockPlayer(player.id, target.id)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fUnblocked \u00A7e${target.name}\u00A7f from sending you TPA requests.`)
    }
}
