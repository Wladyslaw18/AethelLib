import { Kernel } from "../../core/Kernel.js";
import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"

// ----------------------------------------------------------------------------
// | object: SetHomeCommand                                                   |
// | command definition for creating persistent spatial waypoints.             |
// | handles name validation and rank-based quota enforcement.                |
// ----------------------------------------------------------------------------
export const SetHomeCommand = {
    // internal name.
    name: "sethome",
    // human-readable description.
    description: "Create a new home point",
    // syntax guide.
    usage: "/ae:sethome <name>",
    // required permission node.
    permission: "essentials.home",
    // command category.
    category: "teleport",
    // native parameter definitions.
    parameters: [
        { name: "homeName", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the spatial registration pipeline. handles UI routing (if no name),      |
    // | input sanitization, and quota checks before committing to storage.       |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        const name = args[0]

        // if no name is provided, open the visual creation UI.
        if (!name) {
            // dynamic import to keep the command registry lightweight.
            const { showCreateHomeUI } = await import("../../ui/teleport/HomeActionUI.js")
            // execute on next tick to avoid UI constraints.
            Kernel.system.run(() => showCreateHomeUI(player))
            return
        }

        // step 1: name validation.
        // only allow alphanumeric characters and underscores/hyphens.
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Home name can only contain alphanumeric characters.");
            return
        }

        // length constraint to prevent UI overflow or database bloat.
        if (name.length < 1 || name.length > 16) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Home name must be between 1-16 characters.");
            return
        }

        // step 2: resolve spatial metadata.
        const location = player.location
        const dimension = player.dimension.id

        // step 3: quota enforcement.
        // check how many homes the player already has.
        const homeCount = await HomeStore.getHomeCount(player);
        // resolve the limit based on their rank node (default 10).
        const homeLimit = RankSystem.getPermission(player, "home.limit") ?? 10;

        // stop if they are at or over the limit.
        if (homeCount >= homeLimit) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Failed to set home. Limit: \u00A7e${homeCount}/${homeLimit}\u00A77.`);
            return;
        }

        // step 4: persistence commitment.
        // call the home store to save the coordinate data to the player's dynamic properties.
        const success = await HomeStore.setHome(player, name, location, dimension)

        if (success) {
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fHome \u00A7e${name}\u00A7f has been set.`);
        } else {
            // catch-all for database errors or duplicate names (if disallowed).
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Failed to set home.`);
        }
    }
}
