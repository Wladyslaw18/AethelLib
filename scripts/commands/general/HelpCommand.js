import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_MANUAL_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * The primary discovery vector for the command ecosystem. Scans the 
 * CommandRegistry and generates a categorized manifest of all active 
 * functional modules. 
 *
 * PHILOSOPHY: Information is a resource. Use this manual to identify 
 * and calibrate the execution-vectors required for industrial operations.
 */
export const HelpCommand = {
    name: "help",
    description: "Generates the industrial manual for all registered command modules.",
    usage: "!help [command_identifier]",
    permission: null,
    category: "GENERAL",
    parameters: [
        { name: "command_identifier", type: "string", optional: true }
    ],

    /* 
     * MANUAL_QUERY_VECTOR
     */
    execute(player, args) {
        const CommandRegistry = Kernel.get("commandRegistry")
        const topic = args[0]?.toLowerCase()

        if (!topic) {
            this._showAllCommands(player, CommandRegistry)
            return
        }

        const command = CommandRegistry.get(topic)
        if (command) {
            const PermissionManager = Kernel.get("permissions")
            //  SECURITY_FILTER: Prevent manual-leak of unauthorized vectors.
            if (command.permission && !PermissionManager.hasPermission(player, command.permission)) {
                player.sendMessage(`§cSECURITY_FAILURE: CLEARANCE_LEVEL_INADEQUATE`);
                return;
            }
            this._showCommandHelp(player, command)
            return
        }

        player.sendMessage(`§cERROR: MANUAL_IDENTIFIER_NOT_FOUND: '${topic}'`);
        player.sendMessage("§7SUGGESTION: Execute !help for the global industrial manifest.");
    },

    /*
     * GLOBAL_MANIFEST_RENDERER
     * Iterates through the entire registry and groups functional modules 
     * by their industrial category.
     */
    _showAllCommands(player, Registry) {
        const PermissionManager = Kernel.get("permissions")
        const commands = Registry.getAll()
        const categories = {}

        for (const name of commands) {
            const cmd = Registry.get(name)

            // 🛡️ SECURITY_FILTER: Skip commands the player is not authorized to use.
            if (cmd.permission && !PermissionManager.hasPermission(player, cmd.permission)) continue;

            const cat = cmd.category || "GENERAL"
            if (!categories[cat]) categories[cat] = []
            categories[cat].push(name)
        }

        player.sendMessage("§0§l» §6§lINDUSTRIAL_MANUAL_MANIFEST§0 «")
        player.sendMessage("§7Active functional modules and execution-vectors:")

        for (const [cat, cmds] of Object.entries(categories)) {
            player.sendMessage(`\n§e[${cat.toUpperCase()}]`)
            player.sendMessage(`§7${cmds.sort().join(", ")}`)
        }

        player.sendMessage("\n§7Execute !help <identifier> for detailed syntax calibration.");
    },

    /*
     * MODULE_SPECIFIC_MANUAL_RENDERER
     */
    _showCommandHelp(player, command) {
        player.sendMessage(`§0§l» §6§lMANUAL_ENTRY: !${command.name.toUpperCase()}§0 «`)
        player.sendMessage(`§7Manifest_Description: §f${command.description}`)
        player.sendMessage(`§7Syntax_Calibration: §e${command.usage || `!${command.name}`}`)
        if (command.aliases && command.aliases.length > 0) {
            player.sendMessage(`§7Alias_Resolution_Nodes: §8${command.aliases.join(", ")}`)
        }
        if (command.permission) {
            player.sendMessage(`§7Clearance_Requirement: §8${command.permission}`)
        }
    }
}
