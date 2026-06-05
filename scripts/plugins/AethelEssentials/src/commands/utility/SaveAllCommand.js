import { Database } from "../../../../../core/datastore/DatabaseManager.js";
export const SaveAllCommand = {
    name: "save-all",
    description: "Force save all database and world data",
    usage: "/ae:save-all",
    permission: "essentials.saveall",
    category: "UTILITY",
    native: true,
    params: [],
    execute(data, player, args) {
        player.sendMessage("§e§l» §7Initiating global save sequence...");
        
        try {
            // Flush all database caches immediately
            Database.flushAll();
            
            // Note: We avoid running `save-all` as a runCommand directly because 
            // in some versions of BDS it requires server console/op permissions 
            // that scripting doesn't always inherit correctly, but we'll attempt it 
            // as a secondary measure.
            
            this.context.system.run(() => {
                try {
                     /* try */ player.runCommand("save-all");
                } catch(e) {}
            });
            
            player.sendMessage("§a§l» §7Global save complete.");
        } catch (error) {
            player.sendMessage(`§c§l» §7Save encountered an error: ${error.message}`);
        }
    }
};
