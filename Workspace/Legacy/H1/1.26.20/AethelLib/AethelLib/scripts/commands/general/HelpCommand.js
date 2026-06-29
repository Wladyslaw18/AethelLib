import { Kernel } from "../../core/Kernel.js"

/**
 * Help Command - Shows available commands
 */


export const HelpCommand = {
    name: "help",
    description: "Displays a list of available commands",
    parameters: [
        { name: "command", type: "string", optional: true }
    ],

    execute(_data, player, args) {
        const CommandRegistry = Kernel.get("commandRegistry")
        const topic = args[0]?.toLowerCase()

        if (!topic) {
            this._showAllCommands(player, CommandRegistry)
            return
        }

        const command = CommandRegistry.get(topic)
        if (command) {
            const PermissionManager = Kernel.get("permissions")
            if (command.permission && !PermissionManager.hasPermission(player, command.permission)) {
                player.sendMessage("§cYou do not have permission to view this command.");
                return;
            }
            this._showCommandHelp(player, command)
            return
        }

        player.sendMessage(`§cCommand '§e${topic}§c' not found.`);
    },

    /**
     * Show all available commands
     */
    _showAllCommands(player, Registry) {
        const PermissionManager = Kernel.get("permissions")
        const commands = Registry.getAll()
        const visibleCommands = []

        for (const name of commands) {
            const cmd = Registry.get(name)
            // Skip aliases and commands player can't use
            if (name.includes(":")) continue; 
            if (cmd.permission && !PermissionManager.hasPermission(player, cmd.permission)) continue;

            visibleCommands.push(name)
        }

        player.sendMessage(" ")
        player.sendMessage("§6§lAethel§fLib")
        player.sendMessage("§7Commands List")
        player.sendMessage(" ")

        visibleCommands.sort().forEach(name => {
            const cmd = Registry.get(name);
            const split = Math.ceil(name.length / 2);
            const firstHalf = name.substring(0, split);
            const secondHalf = name.substring(split);
            const desc = cmd.description || "No description";
            
            // Padding for alignment (22 characters + 5 extra spaces)
            const padding = " ".repeat(Math.max(5, 22 - name.length));
            
            player.sendMessage(`§6- §6§l${firstHalf}§f§l${secondHalf}${padding}§b§o${desc}`);
        });





        player.sendMessage(" ")
        player.sendMessage("§7Use §6/ae:help <command> §7for more info.")
        player.sendMessage(" ")
    },


    /**
     * Show details for a specific command
     */
    _showCommandHelp(player, command) {
        player.sendMessage(" ")
        player.sendMessage(`§6§l» §f§lCOMMAND: /ae:${command.name.toUpperCase()} §6§l«`);
        player.sendMessage(`§7${command.description}`);
        player.sendMessage(" ")
        player.sendMessage(`§6§lCategory:  §f${command.category || "General"}`);
        player.sendMessage(`§6§lUsage:     §f${command.usage || `/ae:${command.name}`}`);
        
        if (command.aliases && command.aliases.length > 0) {
            player.sendMessage(`§6§lAliases:   §f${command.aliases.join(", ")}`);
        }
        
        if (command.permission) {
            player.sendMessage(`§6§lSecurity:  §f${command.permission}`);
        }
        
        player.sendMessage(" ")
    }
}

