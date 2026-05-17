import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: HelpCommand                                                      |
// | command definition for the centralized documentation and registry lookup. |
// | dynamically generates a list of commands based on the player's permissions.|
// ----------------------------------------------------------------------------
export const HelpCommand = {
    // internal name.
    name: "help",
    // human-readable description.
    description: "Displays a list of available commands",
    // native parameter definitions.
    parameters: [
        { name: "command", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | routes the help request either to the full list or a specific command doc.|
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // fetch the command registry from the kernel.
        const CommandRegistry = Kernel.get("commandRegistry")
        // the first argument is the specific command topic (optional).
        const topic = args[0]?.toLowerCase()

        // if no topic is provided, show the global command menu.
        if (!topic) {
            this._showAllCommands(player, CommandRegistry)
            return
        }

        // otherwise, look up the specific command in the registry.
        const command = CommandRegistry.get(topic)
        if (command) {
            // security gate: check if the player is allowed to see this command's documentation.
            const PermissionManager = Kernel.get("permissions")
            if (command.permission && !PermissionManager.hasPermission(player, command.permission)) {
                player.sendMessage("\xA7cYou do not have permission to view this command.");
                return;
            }
            // display the deep-dive documentation for this specific command.
            this._showCommandHelp(player, command)
            return
        }

        // if the topic didn't match any registered command.
        player.sendMessage(`\xA7cCommand '\xA7e${topic}\xA7c' not found.`);
    },

    // ----------------------------------------------------------------------------
    // | internal: _showAllCommands                                               |
    // | generates the sorted, permission-filtered list of every registered command.|
    // | handles aesthetic alignment and color-coding.                            |
    // ----------------------------------------------------------------------------
    _showAllCommands(player, Registry) {
        const PermissionManager = Kernel.get("permissions")
        // get all command identifiers.
        const commands = Registry.getAll()
        const visibleCommands = []

        // filter pass.
        for (const name of commands) {
            const cmd = Registry.get(name)
            // skip namespaced/aliased internal commands to avoid clutter.
            if (name.includes(":")) continue; 
            // skip commands that the player doesn't have permission to execute.
            if (cmd.permission && !PermissionManager.hasPermission(player, cmd.permission)) continue;
            visibleCommands.push(name)
        }

        // header display.
        player.sendMessage(" ")
        player.sendMessage("\xA76\xA7lAethel\xA7fLib")
        player.sendMessage("\xA77Commands List")
        player.sendMessage(" ")

        // sort alphabetically and print the list.
        visibleCommands.sort().forEach(name => {
            const cmd = Registry.get(name);
            // split the name for a two-tone color effect (orange and white).
            const split = Math.ceil(name.length / 2);
            const firstHalf = name.substring(0, split);
            const secondHalf = name.substring(split);
            const desc = cmd.description || "No description";
            
            // padding logic: calculate whitespace needed to keep descriptions aligned in a column.
            const padding = " ".repeat(Math.max(5, 22 - name.length));
            
            player.sendMessage(`\xA76- \xA76\xA7l${firstHalf}\xA7f\xA7l${secondHalf}${padding}\xA7b\xA7o${desc}`);
        });

        // footer display.
        player.sendMessage(" ")
        player.sendMessage("\xA77Use \xA76/ae:help <command> \xA77for more info.")
        player.sendMessage(" ")
    },

    // ----------------------------------------------------------------------------
    // | internal: _showCommandHelp                                               |
    // | prints detailed metadata for a single command vector.                    |
    // ----------------------------------------------------------------------------
    _showCommandHelp(player, command) {
        player.sendMessage(" ")
        player.sendMessage(`\xA76\xA7l» \xA7f\xA7lCOMMAND: /ae:${command.name.toUpperCase()} \xA76\xA7l«`);
        player.sendMessage(`\xA77${command.description}`);
        player.sendMessage(" ")
        // show category, syntax usage, aliases, and permission node.
        player.sendMessage(`\xA76\xA7lCategory:  \xA7f${command.category || "General"}`);
        player.sendMessage(`\xA76\xA7lUsage:     \xA7f${command.usage || `/ae:${command.name}`}`);
        
        if (command.aliases && command.aliases.length > 0) {
            player.sendMessage(`\xA76\xA7lAliases:   \xA7f${command.aliases.join(", ")}`);
        }
        
        if (command.permission) {
            player.sendMessage(`\xA76\xA7lSecurity:  \xA7f${command.permission}`);
        }
        
        player.sendMessage(" ")
    }
}
