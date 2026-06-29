/**
 * Example Ping Command
 * Demonstration of how to add commands via the Plugin System.
 */

export const PingCommand = {
    name: "ping",
    description: "Testing server responsiveness",
    aliases: ["p"],
    category: "EXAMPLE",
    
    execute(data, player, args) {
        player.sendMessage("§aPONG §7| §fAethelNexus Testing Server");
    }
};
