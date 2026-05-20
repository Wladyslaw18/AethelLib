import { Kernel } from "../../core/Kernel.js";

export const ClearInventoryCommand = {
    name: "aclear",
    aliases: ["clearinventory"],
    description: "Clears a player's inventory",
    usage: "/ae:aclear [player]",
    permission: "essentials.admin.clear",
    category: "Admin",
    parameters: [
        { name: "player", type: "player", optional: true }
    ],
    execute(data, player, args) {
        const target = args[0] || player;
        
        if (!target) {
            player.sendMessage("\u00A7cPlayer not found.");
            return;
        }

        try {
            target.runCommand("clear @s");
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fCleared inventory of \u00A7e${target.name}\u00A7f.`);
            if (target.id !== player.id) {
                target.sendMessage(`\u00A7a\u00A7l» \u00A7fYour inventory was cleared by \u00A7e${player.name}\u00A7f.`);
            }
        } catch (e) {
            player.sendMessage("\u00A7cFailed to clear inventory.");
        }
    }
};
