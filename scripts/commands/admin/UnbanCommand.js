import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: UnbanCommand                                                     |
// | command definition for removing a player from the global blacklist.        |
// | searches the persistent database for matching names and purges them.      |
// ----------------------------------------------------------------------------
export const UnbanCommand = {
    // internal name.
    name: "unban",
    // human-readable description.
    description: "Remove a player from the ban list",
    // syntax guide.
    usage: "/ae:unban <player_identifier>",
    // required permission node.
    permission: "essentials.admin.ban",
    // command category.
    category: "Admin",
    
    // native parameter definitions.
    parameters: [
        { name: "playerName", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | processes the unban request.                                             |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // syntax check.
        if (args.length < 1) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:unban <playerName>");
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Use the exact name the player was banned under.");
            return
        }

        // input normalization.
        const playerName = args[0]
        
        try {
            // fetch the current list of banned players.
            const bans = getBans()
            // search for a record with a matching name (case-insensitive).
            const banIndex = bans.findIndex(ban => ban.playerName && ban.playerName.toLowerCase() === playerName.toLowerCase())
            
            // if no record found, stop.
            if (banIndex === -1) {
                player.sendMessage(`\xA7c\xA7l» \xA77No ban record found for '${playerName}'.`);
                return
            }

            // step 1: record removal.
            // remove the specific entry from the array.
            bans.splice(banIndex, 1)
            // push the updated list back to the database.
            const Database = Kernel.get("database")
            Database.set("ae:bans", bans)
            
            // confirm to the admin.
            player.sendMessage(`\xA7a\xA7l» \xA7fPlayer '${playerName}' has been unbanned.`);

            // step 2: notification broadcast.
            // build an announcement message.
            const unbanMessage = `\xA76\xA7l[\xA7eUNBAN\xA76\xA7l] \xA7r${playerName} \xA77was unbanned by \xA7e${player.name}`;

            // alert other staff members about the unban.
            const PermissionManager = Kernel.get("permissions")
            Kernel.world.getAllPlayers().forEach(p => {
                if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                    p.sendMessage(unbanMessage)
                }
            })
            
        } catch (error) {
            // log any crashes during the data manipulation.
            console.error(`[UnbanCommand] DE-REGISTRATION_CRASH for ${playerName}: ${error}`)
            player.sendMessage("\xA7c\xA7l» \xA77Failed to unban player.");
        }
    }
}

// ----------------------------------------------------------------------------
// | function: getBans                                                        |
// | internal helper to fetch the ban array from Kernel.world storage.               |
// ----------------------------------------------------------------------------
function getBans() {
    try {
        const Database = Kernel.get("database")
        const stored = Database.get("ae:bans")
        return stored || []
    } catch (error) {
        console.error(`[UnbanCommand] REGISTRY_READ_FAILURE: ${error}`)
        return []
    }
}
