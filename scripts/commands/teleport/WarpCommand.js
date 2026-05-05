import { WarpStore } from "../../systems/teleport/WarpStore.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system, world } from "@minecraft/server"

/*
 * INDUSTRIAL_GLOBAL_WAYPOINT_MIGRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the relocation of entities to 
 * public spatial-waypoints (Warps). Implements an O(1) temporal 
 * recharge-registry and executes validated relocation-vectors.
 *
 * PHILOSOPHY: Waypoints are the spatial-nodes of the server. Use this 
 * vector to execute precise migrations to the global navigation manifest.
 */

const cooldowns = new Map() // TEMPORAL_RECHARGE_REGISTRY

export const WarpCommand = {
    name: "warp",
    description: "Executes a spatial-migration to a public server-waypoint.",
    usage: "!warp <waypoint_identifier>",
    permission: "essentials.warp",
    category: "TELEPORTATION",

    /* 
     * MIGRATION_EXECUTION_PIPELINE
     */
    async execute(data, player, args) {
        const name = args[0]
        if (!name) {
            player.sendMessage("§cSYNTAX_ERROR: Usage: !warp <waypoint_identifier>");
            return
        }

        /* RECHARGE_STATUS_CHECK */
        const cd = (RankSystem.getPermission(player, "warp.cooldown") ?? 3) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (system.currentTick - last < cd) {
            const remaining = Math.ceil((cd - (system.currentTick - last)) / 20)
            player.sendMessage(`§cRECHARGE_REQUIRED: Vector stabilizing. Wait §e${remaining}s.`);
            return
        }
        cooldowns.set(player.id, system.currentTick)

        /* WAYPOINT_NODE_RESOLUTION */
        const warp = await WarpStore.getWarp(name)
        if (!warp) {
            player.sendMessage(`§cERROR: WAYPOINT_NODE_NOT_FOUND: '${name}'`);
            return
        }

        /* RELOCATION_EXECUTION_VECTOR */
        system.run(() => {
            try {
                const targetDimension = world.getDimension(warp.dimension)
                if (!targetDimension) {
                    player.sendMessage(`§cERROR: SPATIAL_DIMENSION_NOT_FOUND: '${warp.dimension}'`);
                    return
                }

                player.teleport(
                    { x: warp.x + 0.5, y: warp.y, z: warp.z + 0.5 },
                    { dimension: targetDimension }
                )
                player.sendMessage(`§aMIGRATION_COMPLETE: Relocated to waypoint '§e${name}§a'.`);
            } catch (error) {
                console.error(`[WarpCommand] MIGRATION_FAILURE: ${error}`)
                player.sendMessage("§cERROR: SPATIAL_STABILIZATION_COLLAPSE");
            }
        })
    }
}
