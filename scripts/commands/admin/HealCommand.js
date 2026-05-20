import { Kernel } from "../../core/Kernel.js";

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
        const target = args[0] || player;
        
        if (!target) {
            player.sendMessage("\u00A7cPlayer not found.");
            return;
        }

        const health = target.getComponent("minecraft:health");
        if (health) {
            health.setCurrentValue(health.effectiveMax);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fHealed \u00A7e${target.name}\u00A7f to full health.`);
            if (target.id !== player.id) {
                target.sendMessage(`\u00A7a\u00A7l» \u00A7fYou have been healed by \u00A7e${player.name}\u00A7f.`);
            }
        }
    }
};
