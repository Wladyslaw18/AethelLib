import { world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/*
 * Unban Command
 * ----------------------------------------------------------------------------
 * Handles removing players from the ban list.
 */

export const UnbanCommand = {
    name: "unban",
    description: "Remove a player from the ban list",

    usage: "/ae:unban <player_identifier>",
    permission: "essentials.admin.ban",
    category: "Admin",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length < 1) {
            player.sendMessage("[Manual] Syntax Error: Player identifier required.");
            return
        }

        const playerName = args[0]
        
        try {
            const bans = getBans()
            const banIndex = bans.findIndex(ban => ban.playerName === playerName)
            
            if (banIndex === -1) {
                player.sendMessage(`§c§l» §7No ban record found for '${playerName}'.`);
                return
            }


            /* 
             * REGISTRY_DE-REGISTRATION
             */
            bans.splice(banIndex, 1)
            world.setDynamicProperty("ae:bans", JSON.stringify(bans))
            
            player.sendMessage(`§a§l» §fPlayer '${playerName}' has been unbanned.`);

            
            /* 
             * BROADCAST_NOTIFICATION
             */
            const unbanMessage = `§6§l[§eUNBAN§6§l] §r${playerName} §7was unbanned by §e${player.name}`;

            const PermissionManager = Kernel.get("permissions")
            world.getAllPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(unbanMessage)
                }
            })
            
        } catch (error) {
            console.error(`[UnbanCommand] DE-REGISTRATION_CRASH for ${playerName}: ${error}`)
            player.sendMessage("§c§l» §7Failed to unban player.");

        }
    }
}

/* 
 * BLACKLIST_QUERY_PROTOCOL
 */
function getBans() {
    try {
        const stored = world.getDynamicProperty("ae:bans")
        return (typeof stored === "string") ? JSON.parse(stored) : []
    } catch (error) {
        console.error(`[UnbanCommand] REGISTRY_READ_FAILURE: ${error}`)
        return []
    }
}
