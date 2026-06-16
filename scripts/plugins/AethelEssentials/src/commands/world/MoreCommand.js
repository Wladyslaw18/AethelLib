export const MoreCommand = {
    name: "more",
    description: "Maximize the stack of the item in your hand",
    usage: "/ae:more",
    permission: "essentials.more",
    category: "WORLD",
    native: false,
    params: [],
    execute(data, player, args) {
        const inv = player.getComponent("minecraft:inventory");
        if (!inv || !inv.container) return;
        
        const slot = player.selectedSlotIndex;
        const item = inv.container.getItem(slot);
        
        if (!item) {
            player.sendMessage("§c§l» §7You must be holding an item.");
            return;
        }
        
        const maxAmount = item.maxAmount;
        if (item.amount >= maxAmount) {
            player.sendMessage("§c§l» §7Item is already at max stack size.");
            return;
        }
        
        item.amount = maxAmount;
        inv.container.setItem(slot, item);
        
        player.sendMessage(`§a§l» §7Filled stack to ${maxAmount}.`);
    }
};
