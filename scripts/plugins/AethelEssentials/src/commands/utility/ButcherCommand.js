export const ButcherCommand = {
    name: "butcher",
    description: "Kill all hostile mobs in the dimension",
    usage: "/ae:butcher",
    permission: "essentials.butcher",
    category: "UTILITY",
    native: false,
    params: [],
    execute(data, player, args) {
        let killed = 0;
        const dim = player.dimension;
        const entities = dim.getEntities();
        
        // Basic hostile mob list
        const hostiles = [
            "minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", 
            "minecraft:spider", "minecraft:enderman", "minecraft:witch",
            "minecraft:slime", "minecraft:phantom", "minecraft:drowned",
            "minecraft:husk", "minecraft:stray", "minecraft:wither_skeleton",
            "minecraft:pillager", "minecraft:vindicator", "minecraft:evoker",
            "minecraft:ravager", "minecraft:ghast", "minecraft:blaze",
            "minecraft:magma_cube", "minecraft:hoglin", "minecraft:piglin_brute",
            "minecraft:zoglin", "minecraft:warden"
        ];
        
        for (const entity of entities) {
            if (hostiles.includes(entity.typeId)) {
                entity.kill();
                killed++;
            }
        }
        
        player.sendMessage(`§a§l» §7Butchered ${killed} hostile mobs.`);
    }
};
