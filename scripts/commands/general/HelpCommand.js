/**
 * Help Command - Display command help and categories
 */

export const HelpCommand = {
    name: "help",
    description: "Show available commands and help",
    usage: "!help [category|command]",
    permission: "essentials.help",
    category: "utility",

    execute(data, player, args) {
        const topic = args[0]?.toLowerCase()
        
        if (!topic) {
            showCategories(player)
            return
        }

        // Check if it's a category
        if (CATEGORIES[topic]) {
            showCategory(player, topic)
            return
        }

        // Check if it's a specific command
        const command = getCommandInfo(topic)
        if (command) {
            showCommandHelp(player, command)
            return
        }

        player.sendMessage(`§cNo help found for: §e${topic}`)
        player.sendMessage("§7Use !help to see categories")
    }
}

const CATEGORIES = {
    teleport: {
        name: "Teleport Commands",
        description: "Teleportation and location commands",
        color: "§b",
        commands: ["home", "sethome", "delhome", "listhome", "warp", "setwarp", "delwarp", "listwarp", "spawn", "tpa", "tpahere", "tpaccept", "tpacancel", "tpasetting", "back", "rtp"]
    },
    economy: {
        name: "Economy Commands", 
        description: "Money and trading commands",
        color: "§6",
        commands: ["money", "pay", "topmoney"]
    },
    utility: {
        name: "Utility Commands",
        description: "General utility commands",
        color: "§a",
        commands: ["help", "calculate", "tps", "playerlist", "info", "report", "credit"]
    },
    social: {
        name: "Social Commands",
        description: "Communication and player interaction",
        color: "§d",
        commands: ["message", "reply"]
    }
}

function showCategories(player) {
    player.sendMessage("§6=== Aethelgrad Essentials Help ===")
    player.sendMessage("")
    
    for (const [key, category] of Object.entries(CATEGORIES)) {
        player.sendMessage(`${category.color}${category.name} §7- ${category.description}`)
        player.sendMessage(`§7  Commands: ${category.commands.map(cmd => `!${cmd}`).join(", ")}`)
        player.sendMessage("")
    }
    
    player.sendMessage("§7Use !help <category> for category details")
    player.sendMessage("§7Use !help <command> for command help")
}

function showCategory(player, categoryKey) {
    const category = CATEGORIES[categoryKey]
    if (!category) return
    
    player.sendMessage(`${category.color}=== ${category.name} ===`)
    player.sendMessage(`§7${category.description}`)
    player.sendMessage("")
    
    for (const cmdName of category.commands) {
        const command = getCommandInfo(cmdName)
        if (command) {
            player.sendMessage(`§e!${command.name} §7- ${command.description}`)
        }
    }
}

function showCommandHelp(player, command) {
    player.sendMessage(`§6=== !${command.name} ===`)
    player.sendMessage(`§7Description: ${command.description}`)
    player.sendMessage(`§7Usage: ${command.usage}`)
    
    if (command.permission !== "essentials.help") {
        player.sendMessage(`§7Permission: ${command.permission}`)
    }
}

function getCommandInfo(commandName) {
    // This would ideally query the CommandRegistry
    // For now, return basic info for known commands
    const commands = {
        home: { name: "home", description: "Teleport to your home", usage: "!home [name]", permission: "essentials.home" },
        sethome: { name: "sethome", description: "Set your home location", usage: "!sethome <name>", permission: "essentials.home.set" },
        delhome: { name: "delhome", description: "Delete a home", usage: "!delhome <name>", permission: "essentials.home.delete" },
        listhome: { name: "listhome", description: "List your homes", usage: "!listhome", permission: "essentials.home" },
        warp: { name: "warp", description: "Teleport to a warp", usage: "!warp <name>", permission: "essentials.warp" },
        setwarp: { name: "setwarp", description: "Create a server warp", usage: "!setwarp <name>", permission: "essentials.warp.set" },
        delwarp: { name: "delwarp", description: "Delete a server warp", usage: "!delwarp <name>", permission: "essentials.warp.delete" },
        listwarp: { name: "listwarp", description: "List server warps", usage: "!listwarp", permission: "essentials.warp" },
        spawn: { name: "spawn", description: "Teleport to spawn", usage: "!spawn", permission: "essentials.spawn" },
        tpa: { name: "tpa", description: "Request teleport to player", usage: "!tpa <player>", permission: "essentials.tpa" },
        tpahere: { name: "tpahere", description: "Request player teleport to you", usage: "!tpahere <player>", permission: "essentials.tpa" },
        tpaccept: { name: "tpaccept", description: "Accept TPA request", usage: "!tpaccept [player]", permission: "essentials.tpa" },
        tpacancel: { name: "tpacancel", description: "Cancel TPA requests", usage: "!tpacancel [on/off|player]", permission: "essentials.tpa" },
        tpasetting: { name: "tpasetting", description: "Configure TPA settings", usage: "!tpasetting <on/off>", permission: "essentials.tpa" },
        back: { name: "back", description: "Teleport to last location", usage: "!back", permission: "essentials.back" },
        rtp: { name: "rtp", description: "Random teleport", usage: "!rtp", permission: "essentials.rtp" },
        money: { name: "money", description: "Check your balance", usage: "!money [player]", permission: "essentials.money" },
        pay: { name: "pay", description: "Send money to player", usage: "!pay <player> <amount>", permission: "essentials.pay" },
        topmoney: { name: "topmoney", description: "Show richest players", usage: "!topmoney", permission: "essentials.money" },
        calculate: { name: "calculate", description: "Calculate math expressions", usage: "!calculate <expression>", permission: "essentials.calculate" },
        tps: { name: "tps", description: "Show server TPS", usage: "!tps", permission: "essentials.tps" },
        playerlist: { name: "playerlist", description: "List online players", usage: "!playerlist", permission: "essentials.playerlist" },
        info: { name: "info", description: "Show server information", usage: "!info", permission: "essentials.info" },
        report: { name: "report", description: "Report a player or issue", usage: "!report <player|server> <message>", permission: "essentials.report" },
        credit: { name: "credit", description: "Show addon credits", usage: "!credit", permission: "essentials.help" },
        message: { name: "message", description: "Send private message", usage: "!message <player> <message>", permission: "essentials.message" },
        reply: { name: "reply", description: "Reply to last message", usage: "!reply <message>", permission: "essentials.message" }
    }
    
    return commands[commandName]
}

