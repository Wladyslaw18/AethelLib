import { PluginManager } from "../../core/plugins/PluginManager.js";

// ----------------------------------------------------------------------------
// | object: PluginReloadCommand                                               |
// | dynamically hot-reloads a registered plugin.                              |
// ----------------------------------------------------------------------------
export const PluginReloadCommand = {
    name: "pluginreload",
    description: "Hot-reload an external plugin without rebooting the server",
    usage: "/ae:pluginreload <pluginId>",
    permission: "admin.plugin",
    category: "Admin",
    native: true,
    params: [
        { name: "pluginId", type: "string", optional: false }
    ],
    async execute(data, player, args) {
        const pluginId = args[0];
        if (!pluginId) {
            player.sendMessage("§c§l» §7Usage: /ae:pluginreload <pluginId>");
            return;
        }

        player.sendMessage(`§e§l» §7Hot-reloading plugin '§f${pluginId}§7'...`);
        try {
            const finalId = await PluginManager.reloadPlugin(pluginId);
            player.sendMessage(`§a§l» §7Successfully reloaded plugin '§e${finalId}§7'!`);
        } catch (error) {
            player.sendMessage(`§c§l» §7Failed to reload plugin: §f${error.message}`);
            console.error(`[PluginReloadCommand] Failure: ${error.stack}`);
        }
    }
};
