export const KillAllCommand = {
    name: "killall",
    description: "Kill all specific entities or mobs",
    usage: "/ae:killall [type|all]",
    permission: "essentials.killall",
    category: "UTILITY",
    native: false,
    params: [
        { name: "type", type: "string", optional: true }
    ],
    execute(data, player, args) {
        const type = args[0] ? args[0].toLowerCase() : "all";
        let killed = 0;
        
        const dim = player.dimension;
        const entities = dim.getEntities();
        
        for (const entity of entities) {
            // Never kill players with this command
            if (entity.typeId === "minecraft:player") continue;
            
            if (type === "all") {
                // Kill everything except players and items
                if (entity.typeId !== "minecraft:item") {
                    entity.kill();
                    killed++;
                }
            } else if (entity.typeId.includes(type)) {
                entity.kill();
                killed++;
            }
        }
        
        player.sendMessage(`§a§l» §7Killed ${killed} entities of type '${type}'.`);
    }
};
