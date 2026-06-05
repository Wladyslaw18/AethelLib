export const WeatherCommand = {
    name: "weather",
    description: "Set the weather",
    usage: "/ae:weather <clear|rain|thunder>",
    permission: "essentials.weather",
    category: "WORLD",
    native: false,
    params: [
        { name: "type", type: "string", optional: false }
    ],
    execute(data, player, args) {
        const type = args[0].toLowerCase();
        
        if (!["clear", "rain", "thunder"].includes(type)) {
            player.sendMessage("§c§l» §7Invalid weather type.");
            return;
        }
        
        try { player.runCommand(`weather ${type} 1000000`); } catch (e) {}
        player.sendMessage(`§a§l» §7Weather set to ${type}.`);
    }
};
