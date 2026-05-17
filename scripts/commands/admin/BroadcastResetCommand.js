import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: BroadcastResetCommand                                            |
// | emergency command definition for purging all custom broadcast messages.    |
// | reverts the broadcast system to an empty/default state.                   |
// ----------------------------------------------------------------------------
export const BroadcastResetCommand = {
    // internal name (Order 66 style).
    name: "bc66",
    // human-readable description.
    description: "Reset all custom broadcasts to default",
    // syntax guide.
    usage: "/ae:bc66",
    // required permission node (staff only).
    permission: "admin.broadcast.reset",
    // command category.
    category: "ADMIN",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the purge vector. identifies the broadcast store keys and wipes them.     |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // resolve the persistent stores from the kernel.
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")

        // step 1: absolute purge.
        // overwrite the persistent list with an empty array.
        WorldStore.set(StoreKeys.broadcastList(), [])
        
        // step 2: feedback delivery.
        player.sendMessage("\xA7a\xA7l» \xA7fBroadcast system has been reset.");
        player.sendMessage("\xA77All custom broadcasts have been cleared.");
    }
}
