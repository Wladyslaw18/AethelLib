export const TimeCommand = {
    name: "time",
    description: "Set the world time",
    usage: "/ae:time <day|night|number>",
    permission: "essentials.time",
    category: "WORLD",
    native: false,
    params: [
        { name: "value", type: "string", optional: false }
    ],
    execute(data, player, args) {
        const val = args[0].toLowerCase();
        
        let ticks;
        if (val === "day") {
            ticks = 1000;
        } else if (val === "night") {
            ticks = 13000;
        } else {
            ticks = parseInt(val);
            if (isNaN(ticks)) {
                player.sendMessage("§c§l» §7Invalid time value.");
                return;
            }
        }
        
        try { player.runCommand(`time set ${ticks}`); } catch (e) {}
        player.sendMessage(`§a§l» §7Time set to ${val}.`);
    }
};
