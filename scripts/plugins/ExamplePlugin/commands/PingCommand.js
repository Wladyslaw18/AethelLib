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
        player.sendMessage("\u00A7aPONG \u00A77| \u00A7fAethelNexus Testing Server");
    }
};
