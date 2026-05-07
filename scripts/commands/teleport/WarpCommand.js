import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { Kernel } from "../../core/Kernel.js"

export const WarpCommand = {
    name: "warp",
    description: "Teleport to a global warp point",

    usage: "/ae:warp <waypoint_identifier>",
    permission: "essentials.warp",
    category: "TELEPORTATION",

    async execute(data, player, args) {
        const name = args[0]
        if (!name) {
            player.sendMessage("§c§l» §7Usage: /ae:warp <warp_name>");
            return
        }


        const warp = await WarpStore.getWarp(name)
        const teleportService = Kernel.get("teleportService")

        if (!warp) {
            player.sendMessage(`§c§l» §7Warp point '${name}' not found.`);
            return
        }


        teleportService.teleport(player, { x: warp.x + 0.5, y: warp.y, z: warp.z + 0.5 }, warp.dimension);
        player.sendMessage(`§a§l» §fTeleported to warp §e${name}§f.`);

    }
}
