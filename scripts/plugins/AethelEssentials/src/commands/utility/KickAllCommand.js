import { PermissionManagerInstance } from "../../../../../core/permissions/PermissionManager.js";

export const KickAllCommand = {
    name: "kickall",
    description: "Kick all players (except immune)",
    usage: "/ae:kickall [reason]",
    permission: "essentials.kickall",
    category: "UTILITY",
    native: false,
    params: [
        { name: "reason", type: "string", optional: true }
    ],
    execute(data, player, args) {
        const reason = args.join(" ") || "Server is restarting or under maintenance";
        const players = this.context.world.getAllPlayers();
        
        let kicked = 0;
        
        for (const p of players) {
            // Do not kick the executor
            if (p.id === player.id) continue;
            
            // Check bypass permission (if we have a permission node for it)
            if (PermissionManagerInstance.hasPermission(p, "essentials.kickall.bypass")) {
                continue;
            }
            
            try { p.runCommand(`kick "${p.name}" ${reason}`); } catch (e) {}
            kicked++;
        }
        
        player.sendMessage(`§a§l» §7Kicked ${kicked} players. Reason: ${reason}`);
    }
};
