import { world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/*
 * IDENTITY_RESTORATION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handles the administrative de-registration of an entity from the 
 * persistent blacklist buffer ('ae:bans'). Performs a name-based lookup 
 * and splices the record from the manifest.
 *
 * PHILOSOPHY: Redemption is a system setting. Use this vector to 
 * re-commission previously terminated components.
 */
export const UnbanCommand = {
    name: "unban",
    description: "Re-commissions a specific entity identifier into the industrial buffer.",
    usage: "!unban <player_identifier>",
    permission: "essentials.admin.ban",
    category: "Admin",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(data, player, args) {
        if (args.length < 1) {
            player.sendMessage("[Manual] Syntax Error: Player identifier required.");
            return
        }

        const playerName = args[0]
        
        try {
            const bans = getBans()
            const banIndex = bans.findIndex(ban => ban.playerName === playerName)
            
            if (banIndex === -1) {
                player.sendMessage(`[Error] Query failure: No ban record found for '${playerName}'.`);
                return
            }

            /* 
             * REGISTRY_DE-REGISTRATION
             */
            bans.splice(banIndex, 1)
            world.setDynamicProperty("ae:bans", JSON.stringify(bans))
            
            player.sendMessage(`[Success] Identity '${playerName}' re-commissioned.`);
            
            /* 
             * BROADCAST_NOTIFICATION
             */
            const unbanMessage = `§6§l[§eRE-COMMISSION§6§l] §r${playerName} §7WAS RESTORED BY §e${player.name}`;
            const PermissionManager = Kernel.get("permissions")
            world.getPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(unbanMessage)
                }
            })
            
        } catch (error) {
            console.error(`[UnbanCommand] DE-REGISTRATION_CRASH for ${playerName}: ${error}`)
            player.sendMessage("[Fatal] Restoration pipeline failure.");
        }
    }
}

/* 
 * BLACKLIST_QUERY_PROTOCOL
 */
function getBans() {
    try {
        const stored = world.getDynamicProperty("ae:bans")
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error(`[UnbanCommand] REGISTRY_READ_FAILURE: ${error}`)
        return []
    }
}
