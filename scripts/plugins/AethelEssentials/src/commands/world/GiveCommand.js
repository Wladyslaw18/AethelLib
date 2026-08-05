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
        try {
            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args);
            if (!target || !target.isValid) {
                player.sendMessage("§c§l» §7Player not found or offline.");
                return;
            }

            const itemId = args[consumedArgs];
            if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
                player.sendMessage("§c§l» §7Usage: /ae:agive <player> <item> [amount]");
                return;
            }

            const amountArg = args[consumedArgs + 1];
            const amount = amountArg ? parseInt(amountArg) : 1;
            if (isNaN(amount) || amount <= 0 || amount > 255) {
                player.sendMessage("§c§l» §7Invalid amount (must be 1-255).");
                return;
            }

            const typeId = itemId.includes(":") ? itemId : `minecraft:${itemId}`;
            const item = new Kernel.ItemStack(typeId, amount);

            const rawTarget = target.__rawEntity__ || target;
            const inv = rawTarget.getComponent("minecraft:inventory");

            if (inv && inv.container) {
                const leftover = inv.container.addItem(item);
                if (leftover && leftover.amount > 0) {
                    player.sendMessage(`§e§l» §7Gave ${amount - leftover.amount} of ${typeId} to ${rawTarget.name} (inventory full).`);
                } else {
                    player.sendMessage(`§a§l» §7Gave ${amount} of ${typeId} to ${rawTarget.name}.`);
                }
                if (rawTarget.isValid) rawTarget.sendMessage(`§a§l» §7You received ${amount} of ${typeId} from ${player.name}.`);
            } else {
                player.sendMessage("§c§l» §7Could not access target's inventory.");
            }
        } catch (error) {
            player.sendMessage(`§c§l» §7Failed to give item. Check if ID is valid (${error.message}).`);
        }
    }
};
