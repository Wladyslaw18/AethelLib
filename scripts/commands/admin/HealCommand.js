import { Kernel } from "../../core/Kernel.js";
import { PlayerUtils } from "../../utils/PlayerUtils.js";

export const HealCommand = {
    name: "aheal",
    aliases: ["heal"],
    description: "Heals a player to full health",
    usage: "/ae:aheal [player]",
    permission: "essentials.admin.heal",
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

        const health = finalTarget.getComponent("minecraft:health");
        if (health) {
            health.setCurrentValue(health.effectiveMax);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fHealed \u00A7e${finalTarget.name}\u00A7f to full health.`);
            if (finalTarget.id !== player.id) {
                finalTarget.sendMessage(`\u00A7a\u00A7l» \u00A7fYou have been healed by \u00A7e${player.name}\u00A7f.`);
            }
        }
    }
};
