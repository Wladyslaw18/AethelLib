import { PluginManager } from "../../../../../core/plugins/PluginManager.js";

export const PluginsCommand = {
    name: "plugins",
    description: "List loaded plugins",
    usage: "/ae:plugins",
    permission: "essentials.plugins",
    category: "UTILITY",
    native: true,
    params: [],
    execute(data, player, args) {
        /*
         * ✦ MODULE_RESOLUTION
         * Retrieve keys from the global PluginManager registry.
         */
        const modules = Array.from(PluginManager._plugins.keys());
        
        if (modules.length === 0) {
            player.sendMessage(`§c§l» §7No plugins/modules currently registered.`);
            return;
        }

        player.sendMessage(`§a§l=== LOADED MODULES (${modules.length}) ===`);
        
        // Format it nicely
        let listStr = "";
        modules.forEach((mod, index) => {
            listStr += `§a${mod}`;
            if (index < modules.length - 1) {
                listStr += "§8, ";
            }
        });
        
        player.sendMessage(listStr);
    }
};
