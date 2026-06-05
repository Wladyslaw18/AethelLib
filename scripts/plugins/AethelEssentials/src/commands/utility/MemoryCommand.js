import { Database } from "../../../../../core/datastore/DatabaseManager.js";
import { PluginManager } from "../../../../../core/plugins/PluginManager.js";

export const MemoryCommand = {
    name: "memory",
    description: "View engine diagnostic stats",
    usage: "/ae:memory",
    permission: "essentials.memory",
    category: "UTILITY",
    native: true,
    params: [],
    execute(data, player, args) {
        /*
         * ✦ ENGINE_DIAGNOSTICS
         * Collect memory, datastore, and module registry metrics.
         */
        const dbStats = Database.getStats();
        const activePlugins = PluginManager._plugins.size;
        
        player.sendMessage(`§6§l=== AETHEL ENGINE DIAGNOSTICS ===`);
        player.sendMessage(`§eDatabase Cache: §f${dbStats.cacheSize} keys`);
        player.sendMessage(`§eDirty DB Keys: §f${dbStats.dirtyKeys} pending writes`);
        player.sendMessage(`§eActive Transactions: §f${dbStats.transactionQueues}`);
        player.sendMessage(`§eKernel Modules: §f${activePlugins}`);
        
        // Count total properties saved
        const allIds = this.context.world.getDynamicPropertyIds();
        player.sendMessage(`§eTotal World Properties: §f${allIds.length}`);
    }
};
