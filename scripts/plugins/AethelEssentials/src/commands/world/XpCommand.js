import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";

export const XpCommand = {
    name: "axp",
    description: "Give or take experience levels",
    usage: "/ae:axp [player] <amount>",
    permission: "essentials.xp",
    category: "WORLD",
    native: false,
    params: [
        { name: "amount", type: "integer", optional: false },
        { name: "player", type: "player", optional: true }
    ],
    execute(data, player, args) {
        const amount = typeof args[0] === "number" ? args[0] : parseInt(args[0]);
        const target = args[1] !== undefined ? args[1] : player;

        if (!target) {
            player.sendMessage("§c§l» §7Player not found.");
            return;
        }

        if (isNaN(amount) || amount === 0) {
            player.sendMessage("§c§l» §7Invalid amount (must be non-zero integer).");
            return;
        }

        const absAmount = Math.abs(amount);
        const action = amount > 0 ? "give" : "take";

        if (action === "give") {
            try {
                player.runCommand(`xp ${absAmount}L "${target.name}"`);
                if (target.id === player.id) {
                    player.sendMessage(`§a§l» §7Gave ${absAmount} levels to yourself.`);
                } else {
                    player.sendMessage(`§a§l» §7Gave ${absAmount} levels to ${target.name}.`);
                    target.sendMessage(`§a§l» §7You received ${absAmount} levels from ${player.name}.`);
                }
            } catch (e) {
                player.sendMessage(`§c§l» §7Failed to add experience levels.`);
            }
        } else {
            try {
                player.runCommand(`xp -${absAmount}L "${target.name}"`);
                if (target.id === player.id) {
                    player.sendMessage(`§a§l» §7Took ${absAmount} levels from yourself.`);
                } else {
                    player.sendMessage(`§a§l» §7Took ${absAmount} levels from ${target.name}.`);
                    target.sendMessage(`§c§l» §7${player.name} took ${absAmount} levels from you.`);
                }
            } catch (e) {
                player.sendMessage(`§c§l» §7Failed to take experience levels.`);
            }
        }
    }
};
