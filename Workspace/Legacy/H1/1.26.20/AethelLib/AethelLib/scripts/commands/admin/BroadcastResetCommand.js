import { Kernel } from "../../core/Kernel.js"

/*
 * Broadcast Reset Command
 * ----------------------------------------------------------------------------
 * Resets the server broadcast list to default.
 */

export const BroadcastResetCommand = {
    name: "bc66",
    description: "Reset all custom broadcasts to default",

    usage: "/ae:bc66",
    permission: "admin.broadcast.reset",
    category: "ADMIN",

    execute(_data, player, _args) {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")

        // Reset the persistent broadcast list
        WorldStore.set(StoreKeys.broadcastList(), [])
        
        player.sendMessage("§a§l» §fBroadcast system has been reset.");
        player.sendMessage("§7All custom broadcasts have been cleared.");

    }
}
