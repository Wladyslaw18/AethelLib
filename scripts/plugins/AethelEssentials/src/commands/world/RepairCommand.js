export const RepairCommand = {
    name: "repair",
    aliases: ["arepair"],
    description: "Repair the item in your hand",
    usage: "/ae:repair",
    permission: "essentials.repair",
    category: "WORLD",
    native: false,
    params: [],
    execute(data, player, args) {
        const inv = player.getComponent("minecraft:inventory");
        if (!inv || !inv.container) return;
        
        const slot = player.selectedSlotIndex;
        const item = inv.container.getItem(slot);
        
        if (!item) {
            player.sendMessage("§c§l» §7You must be holding an item to repair.");
            return;
        }
        
        const durComp = item.getComponent("minecraft:durability");
        
        if (!durComp) {
            player.sendMessage("§c§l» §7This item cannot be repaired.");
            return;
        }
        
        durComp.damage = 0;
        inv.container.setItem(slot, item);
        
        player.sendMessage("§a§l» §7Item repaired.");
    }
};
