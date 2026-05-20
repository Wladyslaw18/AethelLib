import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: WhoisCommand                                                     |
// | command definition for intensive entity inspection.                        |
// | aggregates data from multiple kernels (Permissions, Economy, Teleport).   |
// ----------------------------------------------------------------------------
export const WhoisCommand = {
    // internal name.
    name: "inspect",
    // human-readable description.
    description: "Inspect detailed player information and coordinates",
    // syntax guide.
    usage: "/ae:inspect <player>",
    // required permission node (staff level recommended).
    permission: "admin",
    // command category.
    category: "ADMINISTRATION",
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
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:inspect <player>");
            player.sendMessage("\u00A7e\u00A7l» \u00A7fTip: \u00A77Type a player name to view their info.");
            return
        }

        // resolve the target entity.
        const targetName = args.join(" ")
        const target = PlayerUtils.findPlayer(targetName)

        // check if target is online.
        if (!target) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Player '${targetName}' not found.`);
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
        const tpaStatus = TpaStore.isEnabled(target.id) ? "\u00A7aEnabled" : "\u00A7cDisabled"

        // step 3: formatted output.
        player.sendMessage(`\u00A76\u00A7l» \u00A7ePlayer Info: \u00A7f${target.name} \u00A76\u00A7l«`)
        player.sendMessage(`\u00A77Rank: \u00A7e${rank?.displayName || "Member"}`)
        player.sendMessage(`\u00A77Balance: \u00A76$${balance.toLocaleString()}`)
        // resolve dimension name (strip the namespace).
        player.sendMessage(`\u00A77Dimension: \u00A7b${target.dimension.id.split(':').pop().toUpperCase()}`)
        // resolve spatial coordinates.
        player.sendMessage(`\u00A77Coords: \u00A78(${Math.floor(target.location.x)}, ${Math.floor(target.location.y)}, ${Math.floor(target.location.z)})`)
        player.sendMessage(`\u00A77TPA: ${tpaStatus}`)
    }
}
