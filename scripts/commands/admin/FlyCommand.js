import { PlayerUtils } from "../../utils/PlayerUtils.js";

export const FlyCommand = {
    name: "afly",
    aliases: ["fly"],
    description: "Toggles flight for a player",
    usage: "/ae:afly [player]",
    permission: "essentials.admin.fly",
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

        const isFlying = finalTarget.getDynamicProperty("ae:is_flying") ?? false;
        const newState = !isFlying;
        
        finalTarget.setDynamicProperty("ae:is_flying", newState);
        
        // Bedrock API for flight is usually tied to abilities or gamemode.
        // In some beta versions, we can use target.getAbilities().flyEnabled
        try {
            /* try */ finalTarget.runCommand(`ability @s mayfly ${newState}`);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fFlight \u00A7e${newState ? "enabled" : "disabled"}\u00A7f for \u00A7e${finalTarget.name}\u00A7f.`);
            if (finalTarget.id !== player.id) {
                finalTarget.sendMessage(`\u00A7a\u00A7l» \u00A7fFlight was \u00A7e${newState ? "enabled" : "disabled"}\u00A7f by \u00A7e${player.name}\u00A7f.`);
            }
        } catch (e) {
            player.sendMessage("\u00A7cFailed to toggle flight. Ensure cheats are enabled or use a compatible engine version.");
        }
    }
};
