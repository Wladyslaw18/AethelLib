import { Kernel } from "../../core/Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js";

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
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        const finalTarget = target || player;
        
        if (!finalTarget) {
            player.sendMessage("\u00A7cPlayer not found.");
            return;
        }

        try {
            /* try */ finalTarget.runCommand("clear @s");
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fCleared inventory of \u00A7e${finalTarget.name}\u00A7f.`);
            if (finalTarget.id !== player.id) {
                finalTarget.sendMessage(`\u00A7a\u00A7l» \u00A7fYour inventory was cleared by \u00A7e${player.name}\u00A7f.`);
            }
        } catch (e) {
            player.sendMessage("\u00A7cFailed to clear inventory.");
        }
    }
};
