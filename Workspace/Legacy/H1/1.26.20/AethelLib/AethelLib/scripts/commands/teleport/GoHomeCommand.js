import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { Kernel } from "../../core/Kernel.js"
import { system } from "@minecraft/server"

/*
 * Home Command
 * ----------------------------------------------------------------------------
 * Teleports players to their saved home locations.
 */


const cooldowns = new Map() // TEMPORAL_RECHARGE_REGISTRY

export const GoHomeCommand = {
    name: "home",
    description: "Teleport to one of your homes",

    usage: "/ae:home <anchor_identifier>",
    permission: "essentials.home",
    category: "TELEPORTATION",
    parameters: [
        { name: "homeName", type: "string", optional: false }
    ],

    /* 
     * MIGRATION_EXECUTION_PIPELINE
     */
    async execute(_data, player, args) {
        const name = args[0]
        if (!name) {
            player.sendMessage("§c§l» §7Usage: /ae:home <home_name>");
            return
        }


        const PermissionManager = Kernel.get("permissions")
        const TeleportService = Kernel.get("teleportService")

        /* RECHARGE_STATUS_CHECK */
        const cdValue = PermissionManager.hasPermission(player, "home.cooldown") ?? 30
        const cd = Number(cdValue) * 20
        const last = cooldowns.get(player.id) ?? 0
        
        if (system.currentTick - last < cd) {
            const remaining = Math.ceil((cd - (system.currentTick - last)) / 20)
            player.sendMessage(`§c§l» §7Please wait §e${remaining}s §7before using this again.`);
            return
        }


        /* ANCHOR_NODE_RESOLUTION */
        const home = await HomeStore.getHome(player, name)
        if (!home) {
            player.sendMessage(`§c§l» §7Home '${name}' not found.`);
            return
        }


        /* WAIT_TIME_RESOLUTION */
        const waitTime = Number(PermissionManager.hasPermission(player, "teleport.wait") ?? 5)

        /* RELOCATION_EXECUTION_VECTOR */
        if (waitTime > 0) {
            TeleportService.teleportWithWait(player, { x: home.x + 0.5, y: home.y, z: home.z + 0.5 }, home.dimension, waitTime);
        } else {
            TeleportService.teleport(player, { x: home.x + 0.5, y: home.y, z: home.z + 0.5 }, home.dimension);
            player.sendMessage(`§a§l» §fTeleported to home §e${name}§f.`);
        }


        cooldowns.set(player.id, system.currentTick)
    }
}
