export const EnchantCommand = {
    name: "aenchant",
    description: "Enchant the item in your hand",
    usage: "/ae:aenchant <enchantment> [level]",
    permission: "essentials.enchant",
    category: "WORLD",
    native: false,
    params: [
        { name: "enchantment", type: "string", optional: false },
        { name: "level", type: "number", optional: true }
    ],
    execute(data, player, args) {
        const enchant = args[0].toLowerCase();
        const level = args[1] ? parseInt(args[1]) : 1;
        
        // Use runCommand because manipulating enchantments via scripting API 
        // requires specific item components and can be brittle across versions.
        try {
            /* try */ player.runCommand(`enchant @s ${enchant} ${level}`);
            player.sendMessage(`§a§l» §7Enchantment applied.`);
        } catch (error) {
            player.sendMessage(`§c§l» §7Failed to apply enchantment: ${error.message}`);
        }
    }
};
