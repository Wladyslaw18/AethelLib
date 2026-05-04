/**
 * Spawn Command - Teleport to spawn warp (if it exists)
 */

import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { system, world } from "@minecraft/server"

export const SpawnCommand = {
    name: "spawn",
    description: "Teleport to the server spawn",
    usage: "!spawn",
    permission: "essentials.spawn",
    category: "teleport",

    async execute(data, player, args) {
        const spawn = await WarpStore.getWarp("spawn")
        
        if (!spawn) {
            player.sendMessage("§cSpawn has not been set. Ask an admin to create it with !setwarp spawn")
            return
        }

        // Wrap teleport in system.run() to prevent "Busy Context" crash
        system.run(() => {
            try {
                const targetDimension = world.getDimension(spawn.dimension)
                
                // Check if dimension exists
                if (!targetDimension) {
                    player.sendMessage(`§cSpawn dimension '${spawn.dimension}' not found`)
                    return
                }

                player.teleport(
                    { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 },
                    { dimension: targetDimension }
                )
                
                player.sendMessage("§aTeleported to spawn")
            } catch (error) {
                console.error(`Spawn teleport error: ${error}`)
                player.sendMessage("§cFailed to teleport to spawn")
            }
        })
    }
}
