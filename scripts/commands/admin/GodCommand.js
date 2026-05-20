import { Kernel } from "../../core/Kernel.js";

export const GodCommand = {
    name: "agod",
    aliases: ["god"],
    description: "Toggles invulnerability for a player",
    usage: "/ae:agod [player]",
    permission: "essentials.admin.god",
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

        const isGod = target.getDynamicProperty("ae:is_god") ?? false;
        const newState = !isGod;
        
        target.setDynamicProperty("ae:is_god", newState);
        
        if (newState) {
            target.addTag("ae:god_mode");
        } else {
            target.removeTag("ae:god_mode");
        }

        player.sendMessage(`\u00A7a\u00A7l» \u00A7fGod mode \u00A7e${newState ? "enabled" : "disabled"}\u00A7f for \u00A7e${target.name}\u00A7f.`);
        if (target.id !== player.id) {
            target.sendMessage(`\u00A7a\u00A7l» \u00A7fGod mode was \u00A7e${newState ? "enabled" : "disabled"}\u00A7f by \u00A7e${player.name}\u00A7f.`);
        }
    }
};
