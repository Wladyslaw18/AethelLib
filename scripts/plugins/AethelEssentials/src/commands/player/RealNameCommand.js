export const RealNameCommand = {
    name: "realname",
    description: "Find the real username behind a nickname",
    usage: "/ae:realname <nickname>",
    permission: "essentials.realname",
    category: "PLAYER",
    native: false,
    params: [
        { name: "nickname", type: "string", optional: false }
    ],
    execute(data, player, args) {
        const query = args.join(" ").toLowerCase();
        
        const players = this.context.world.getAllPlayers();
        
        for (const p of players) {
            // Strip formatting codes from nametag for comparison if needed
            // For now just basic includes check
            const rawNameTag = p.nameTag.replace(/§[0-9a-fk-or]/g, "").toLowerCase();
            
            if (rawNameTag.includes(query) && p.name !== p.nameTag) {
                player.sendMessage(`§a§l» §7The real name of §r${p.nameTag}§7 is: §f${p.name}`);
                return;
            }
        }
        
        player.sendMessage(`§c§l» §7Could not find an online player with a nickname matching '${query}'.`);
    }
};
