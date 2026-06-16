import { PlayerUtils } from "../../../../../utils/PlayerUtils.js";
import { Kernel } from "../../../../../core/Kernel.js";

export const GiveCommand = {
    name: "agive",
    description: "Give an item to a player",
    usage: "/ae:agive <player> <item> [amount]",
    permission: "essentials.give",
    category: "WORLD",
    native: false,
    params: [
        { name: "player", type: "player", optional: false },
        { name: "item", type: "string", optional: false },
        { name: "amount", type: "number", optional: true }
    ],
    execute(data, player, args) {
        const { player: target } = PlayerUtils.resolveFromArgs(args);
        const itemId = args[1];
        const amount = args[2] ? parseInt(args[2]) : 1;
        
        if (!target) {
            player.sendMessage("§c§l» §7Player not found.");
            return;
        }
        
        if (isNaN(amount) || amount <= 0 || amount > 255) {
            player.sendMessage("§c§l» §7Invalid amount (must be 1-255).");
            return;
        }
        
        try {
            // Ensure namespace prefix exists
            const typeId = itemId.includes(":") ? itemId : `minecraft:${itemId}`;
            const item = new Kernel.ItemStack(typeId, amount);
            
            const inv = target.getComponent("minecraft:inventory");
            if (inv && inv.container) {
                inv.container.addItem(item);
                player.sendMessage(`§a§l» §7Gave ${amount} of ${typeId} to ${target.name}.`);
                target.sendMessage(`§a§l» §7You received ${amount} of ${typeId} from ${player.name}.`);
            } else {
                player.sendMessage("§c§l» §7Could not access target's inventory.");
            }
        } catch (error) {
            player.sendMessage(`§c§l» §7Failed to give item. Check if ID is valid. (${error.message})`);
        }
    }
};
