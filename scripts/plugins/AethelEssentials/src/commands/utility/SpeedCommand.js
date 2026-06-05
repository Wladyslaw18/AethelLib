import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";

export const SpeedCommand = {
    name: "speed",
    description: "Change movement speed",
    usage: "/ae:speed <number> [player]",
    permission: "essentials.speed",
    category: "UTILITY",
    native: false,
    params: [
        { name: "speed", type: "number", optional: false },
        { name: "player", type: "player", optional: true }
    ],
    execute(data, player, args) {
        const speed = parseFloat(args[0]);
        if (isNaN(speed) || speed <= 0 || speed > 10) {
            player.sendMessage("§c§l» §7Speed must be a number between 0.1 and 10.");
            return;
        }

        let target = player;
        if (args.length > 1) {
            const { player: resolved } = PlayerUtils.resolveFromArgs(args.slice(1));
            if (resolved) {
                target = resolved;
            } else {
                player.sendMessage("§c§l» §7Player not found.");
                return;
            }
        }
        
        // Use standard movement component if available, else speed effect
        const movement = target.getComponent("minecraft:movement");
        
        if (movement) {
            // Default walk speed is ~0.1
            movement.setCurrentValue(0.1 * speed);
        } else {
            // Fallback to speed effect
            if (speed > 1) {
                try { target.runCommand(`effect @s speed 99999 ${Math.floor(speed) - 1} true`); } catch (e) {}
            } else {
                try { target.runCommand(`effect @s speed 0 0`); } catch (e) {}
            }
        }

        player.sendMessage(`§a§l» §7Speed set to ${speed} for ${target.name}.`);
    }
};
