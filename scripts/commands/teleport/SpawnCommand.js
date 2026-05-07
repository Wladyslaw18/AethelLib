import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { Kernel } from "../../core/Kernel.js"

export const SpawnCommand = {
    name: "spawn",
    description: "Return to the server spawn point",

    usage: "/ae:spawn",
    permission: "essentials.spawn",
    category: "teleport",

    async execute(data, player, args) {
        const spawn = await WarpStore.getWarp("spawn")
        const teleportService = Kernel.get("teleportService")
        
        if (!spawn) {
            player.sendMessage("§c§l» §7Spawn has not been set yet.");
            return
        }


        teleportService.teleport(player, { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 }, spawn.dimension);
        player.sendMessage("§a§l» §fTeleported to spawn.");
    }
}

