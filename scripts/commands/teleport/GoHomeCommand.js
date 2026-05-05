import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system, world } from "@minecraft/server"

/*
 * INDUSTRIAL_SPATIAL_ANCHOR_MIGRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the relocation of entities to 
 * their registered spatial-anchors (Homes). Implements an O(1) temporal 
 * recharge-registry and executes validated relocation-vectors.
 *
 * PHILOSOPHY: Anchors are the fixed nodes of the empire. Use this vector 
 * to execute precise spatial-migrations to the entity's designated 
 * coordinate-buffer.
 */

const cooldowns = new Map() // TEMPORAL_RECHARGE_REGISTRY

export const GoHomeCommand = {
    name: "home",
    description: "Executes a spatial-migration to a registered entity-anchor.",
    usage: "!home <anchor_identifier>",
    permission: "essentials.home",
    category: "TELEPORTATION",

    /* 
     * MIGRATION_EXECUTION_PIPELINE
     */
    async execute(data, player, args) {
        const name = args[0]
        if (!name) {
            player.sendMessage("§cSYNTAX_ERROR: Usage: !home <anchor_identifier>");
            return
        }

        /* RECHARGE_STATUS_CHECK */
        const cd = (RankSystem.getPermission(player, "home.cooldown") ?? 2) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (system.currentTick - last < cd) {
            const remaining = Math.ceil((cd - (system.currentTick - last)) / 20)
            player.sendMessage(`§cRECHARGE_REQUIRED: Vector stabilizing. Wait §e${remaining}s.`);
            return
        }
        cooldowns.set(player.id, system.currentTick)

        /* ANCHOR_NODE_RESOLUTION */
        const home = await HomeStore.getHome(player, name)
        if (!home) {
            player.sendMessage(`§cERROR: ANCHOR_NODE_NOT_FOUND: '${name}'`);
            return
        }

        /* RELOCATION_EXECUTION_VECTOR */
        system.run(() => {
            try {
                const targetDimension = world.getDimension(home.dimension)
                if (!targetDimension) {
                    player.sendMessage(`§cERROR: SPATIAL_DIMENSION_NOT_FOUND: '${home.dimension}'`);
                    return
                }

                player.teleport(
                    { x: home.x + 0.5, y: home.y, z: home.z + 0.5 },
                    { dimension: targetDimension }
                )
                player.sendMessage(`§aMIGRATION_COMPLETE: Relocated to anchor '§e${name}§a'.`);
            } catch (error) {
                console.error(`[GoHomeCommand] MIGRATION_FAILURE: ${error}`)
                player.sendMessage("§cERROR: SPATIAL_STABILIZATION_COLLAPSE");
            }
        })
    }
}
