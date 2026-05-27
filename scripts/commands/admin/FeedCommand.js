import { Kernel } from "../../core/Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js";

export const FeedCommand = {
    name: "afeed",
    aliases: ["feed"],
    description: "Satiates a player's hunger",
    usage: "/ae:afeed [player]",
    permission: "essentials.admin.feed",
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

        const hunger = finalTarget.getComponent("minecraft:hunger");
        if (hunger) {
            hunger.setCurrentValue(20);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fSatiated \u00A7e${finalTarget.name}\u00A7f.`);
            if (finalTarget.id !== player.id) {
                finalTarget.sendMessage(`\u00A7a\u00A7l» \u00A7fYour hunger was satiated by \u00A7e${player.name}\u00A7f.`);
            }
        }
    }
};
