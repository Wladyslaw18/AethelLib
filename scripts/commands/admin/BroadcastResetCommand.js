import { Kernel } from "../../core/Kernel.js"

/*
 * BROADCAST_PROTOCOL_66
 * ----------------------------------------------------------------------------
 * A high-clearance administrative vector designed to surgically purge the 
 * dynamic broadcast buffer and reset the system to absolute zero.
 *
 * PHILOSOPHY: When the communication stream is compromised, initiate 
 * Protocol 66 to restore industrial silence.
 */
export const BroadcastResetCommand = {
    name: "bc66",
    description: "Surgically purges and resets all dynamic broadcasts.",
    usage: "!bc66",
    permission: "admin.broadcast.reset",
    category: "ADMIN",

    execute(player) {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")

        // 🏛️ INDUSTRIAL_PURGE: Wipe the persistent broadcast list
        WorldStore.set(StoreKeys.broadcastList(), [])
        
        player.sendMessage("§0§l» §c§lPROTOCOL_66_EXECUTED §0«")
        player.sendMessage("§7All dynamic broadcasts have been purged from the persistent buffer.");
        player.sendMessage("§7The system has been recalibrated to the Polish Peak baseline.");
    }
}
