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
    description: "Displays a list of available commands and Aethelgrad lore",
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

        // check for special lore-based easter eggs
        if (topic === "lore") {
            this._showLore(player)
            return
        }
        if (topic === "forge" || topic === "rules") {
            this._showForgeRules(player)
            return
        }

        // otherwise, look up the specific command in the registry.
        const command = CommandRegistry.get(topic)
        if (command) {
            // security gate: check if the player is allowed to see this command's documentation.
            const PermissionManager = Kernel.get("permissions")
            if (command.permission && !PermissionManager.hasPermission(player, command.permission)) {
                player.sendMessage("\u00A7cYou do not have permission to view this command.");
                return;
            }
            // display the deep-dive documentation for this specific command.
            this._showCommandHelp(player, command)
            return
        }

        // if the topic didn't match any registered command.
        player.sendMessage(`\u00A7cCommand/Topic '\u00A7e${topic}\u00A7c' not found.`);
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
        player.sendMessage("\u00A76\u00A7lAethel\u00A7fLib \u00A7r\u00A78\u2022 \u00A77v1.0.8")
        player.sendMessage("\u00A78\"Built at 3am. Tested in production. Regretted nothing.\"")
        player.sendMessage(" ")
        player.sendMessage("\u00A7eType \u00A76/ae:help lore \u00A7efor the history of the realm.")
        player.sendMessage("\u00A7eType \u00A76/ae:help forge \u00A7efor the Rules of the Forge.")
        player.sendMessage("\u00A7eType \u00A76/ae:help <command> \u00A7efor specific syntax.")
        player.sendMessage(" ")
        player.sendMessage("\u00A7d--- \u00A7lCOMMANDS LIST \u00A7r\u00A7d---")
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
            
            player.sendMessage(`\u00A76- \u00A76\u00A7l${firstHalf}\u00A7f\u00A7l${secondHalf}${padding}\u00A7b\u00A7o${desc}`);
        });

        player.sendMessage(" ")
    },

    // ----------------------------------------------------------------------------
    // | internal: _showLore                                                      |
    // | prints background developer/realm history.                               |
    // ----------------------------------------------------------------------------
    _showLore(player) {
        player.sendMessage(" ")
        player.sendMessage("\u00A76\u00A7l» \u00A7f\u00A7lLORE: THE AETHELGRAD CHRONICLES \u00A76\u00A7l«")
        player.sendMessage("\u00A7d=============================================")
        player.sendMessage("\u00A77Wladyslaw18, fueled by sleep deprivation and 3am delirium,")
        player.sendMessage("\u00A77was tired. Tired of Map leaks bloating memory, tired of")
        player.sendMessage("\u00A77Database locks choking the engine, and tired of Mojang's")
        player.sendMessage("\u00A77API updates breaking everything at runtime.")
        player.sendMessage(" ")
        player.sendMessage("\u00A77So he forged the \u00A76Stable Proxy Pattern\u00A77:")
        player.sendMessage("\u00A7a  YOUR CODE \u2192 Kernel \u2192 Minecraft API")
        player.sendMessage(" ")
        player.sendMessage("\u00A77The Kernel acts as a modular shield, absorbing the")
        player.sendMessage("\u00A77runtime pain so your logic survives. The boot sequence")
        player.sendMessage("\u00A77runs in \u00A7a3 phases\u00A77 so nothing blows up during startup.")
        player.sendMessage(" ")
        player.sendMessage("\u00A77It is a hard-coded shield, tested in production,")
        player.sendMessage("\u00A77with absolutely zero regrets.")
        player.sendMessage("\u00A7d=============================================")
        player.sendMessage(" ")
    },

    // ----------------------------------------------------------------------------
    // | internal: _showForgeRules                                                |
    // | prints the strict coding rules.                                          |
    // ----------------------------------------------------------------------------
    _showForgeRules(player) {
        player.sendMessage(" ")
        player.sendMessage("\u00A76\u00A7l» \u00A7f\u00A7lLORE: THE RULES OF THE FORGE \u00A76\u00A7l«")
        player.sendMessage("\u00A7d=============================================")
        player.sendMessage("\u00A7eRule 1: Keep it Tiny")
        player.sendMessage("\u00A77- Files over 120 lines get refactored. Keep it modular")
        player.sendMessage("\u00A77  or face the wrath of 2am refactoring sessions.")
        player.sendMessage(" ")
        player.sendMessage("\u00A7eRule 2: Zero-Bypass")
        player.sendMessage("\u00A77- Always use the Kernel. Going rogue is fun until the")
        player.sendMessage("\u00A77  engine updates and your clever hack breaks.")
        player.sendMessage(" ")
        player.sendMessage("\u00A7eRule 3: Clean Your Trash")
        player.sendMessage("\u00A77- Use the sharded DB and cache. Avoid bloated buffers")
        player.sendMessage("\u00A77  so the server Watchdog doesn't terminate us.")
        player.sendMessage(" ")
        player.sendMessage("\u00A7eRule 4: The Vibe Check")
        player.sendMessage("\u00A77- If it works, it's \u00A7a\"Industrial Peak\"\u00A77. If it crashes,")
        player.sendMessage("\u00A77  it's an \u00A7c\"Advanced Feature Request\"\u00A77. There is no in-between.")
        player.sendMessage(" ")
        player.sendMessage("\u00A7eRule 5: Pure Command Supremacy")
        player.sendMessage("\u00A77- UI is for the weak (mostly because the author is bad")
        player.sendMessage("\u00A77  at building them). Commands are faster and cleaner.")
        player.sendMessage("\u00A7d=============================================")
        player.sendMessage(" ")
    },

    // ----------------------------------------------------------------------------
    // | internal: _showCommandHelp                                               |
    // | prints detailed metadata for a single command vector.                    |
    // ----------------------------------------------------------------------------
    _showCommandHelp(player, command) {
        player.sendMessage(" ")
        player.sendMessage(`\u00A76\u00A7l» \u00A7f\u00A7lCOMMAND: /ae:${command.name.toUpperCase()} \u00A76\u00A7l«`);
        player.sendMessage(`\u00A77${command.description}`);
        player.sendMessage(" ")
        // show category, syntax usage, aliases, and permission node.
        player.sendMessage(`\u00A76\u00A7lCategory:  \u00A7f${command.category || "General"}`);
        player.sendMessage(`\u00A76\u00A7lUsage:     \u00A7f${command.usage || `/ae:${command.name}`}`);
        
        if (command.aliases && command.aliases.length > 0) {
            player.sendMessage(`\u00A76\u00A7lAliases:   \u00A7f${command.aliases.join(", ")}`);
        }
        
        if (command.permission) {
            player.sendMessage(`\u00A76\u00A7lSecurity:  \u00A7f${command.permission}`);
        }
        
        player.sendMessage(" ")
    }
}
