import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";

export const XpCommand = {
    name: "axp",
    description: "Give or take experience levels",
    usage: "/ae:axp <give|take> <player> <amount>",
    permission: "essentials.xp",
    category: "WORLD",
    native: false,
    params: [
        { name: "action", type: "string", optional: false },
        { name: "player", type: "player", optional: false },
        { name: "amount", type: "number", optional: false }
    ],
    execute(data, player, args) {
        const action = args[0].toLowerCase();
        const resolveResult = PlayerUtils.resolveFromArgs(args.slice(1));
        const target = resolveResult.player;
        
        if (!target) {
            player.sendMessage("§c§l» §7Player not found.");
            return;
        }

        const amountIndex = 1 + resolveResult.consumedArgs;
        const amount = parseInt(args[amountIndex]);
        
        if (isNaN(amount) || amount <= 0) {
            player.sendMessage("§c§l» §7Invalid amount.");
            return;
        }
        
        if (action === "give") {
            // Using runCommand because standard API doesn't expose addExperience in 2.8.0 properly yet
            try { player.runCommand(`xp ${amount}L "${target.name}"`); } catch (e) {}
            player.sendMessage(`§a§l» §7Gave ${amount} levels to ${target.name}.`);
        } else if (action === "take") {
            try { player.runCommand(`xp -${amount}L "${target.name}"`); } catch (e) {}
            player.sendMessage(`§a§l» §7Took ${amount} levels from ${target.name}.`);
        } else {
            player.sendMessage("§c§l» §7Action must be 'give' or 'take'.");
        }
    }
};
