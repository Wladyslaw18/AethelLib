import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: WhoisCommand                                                     |
// | command definition for intensive entity inspection.                        |
// | aggregates data from multiple kernels (Permissions, Economy, Teleport).   |
// ----------------------------------------------------------------------------
export const WhoisCommand = {
    // internal name.
    name: "whois",
    // human-readable description.
    description: "View detailed player information",
    // syntax guide.
    usage: "/ae:whois <player>",
    // required permission node (staff level recommended).
    permission: "essentials.whois",
    // command category.
    category: "Utility",
    // native parameter definitions.
    parameters: [
        { name: "player", type: "player", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the data aggregation pipeline. fetches state from disparate stores and    |
    // | compile them into a single diagnostic view.                              |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // syntax validation.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:whois <player>");
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Type a player name to view their info.");
            return
        }

        // resolve the target entity.
        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        // check if target is online.
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${targetName}' not found.`);
            return
        }

        // step 1: resolve sub-system services from the kernel.
        const PermissionManager = Kernel.get("permissions")
        const Economy = Kernel.get("economy")
        const TpaStore = Kernel.get("tpaStore")
        
        // step 2: query individual data points.
        // resolve rank node.
        const rank = PermissionManager.getHighestRank(target)
        // resolve financial balance.
        const balance = Economy.getBalance(target)
        // resolve TPA availability.
        const tpaStatus = TpaStore.isEnabled(target.id) ? "\xA7aEnabled" : "\xA7cDisabled"

        // step 3: formatted output.
        player.sendMessage(`\xA76\xA7l» \xA7ePlayer Info: \xA7f${target.name} \xA76\xA7l«`)
        player.sendMessage(`\xA77Rank: \xA7e${rank?.displayName || "Member"}`)
        player.sendMessage(`\xA77Balance: \xA76$${balance.toLocaleString()}`)
        // resolve dimension name (strip the namespace).
        player.sendMessage(`\xA77Dimension: \xA7b${target.dimension.id.split(':').pop().toUpperCase()}`)
        // resolve spatial coordinates.
        player.sendMessage(`\xA77Coords: \xA78(${Math.floor(target.location.x)}, ${Math.floor(target.location.y)}, ${Math.floor(target.location.z)})`)
        player.sendMessage(`\xA77TPA: ${tpaStatus}`)
    }
}
