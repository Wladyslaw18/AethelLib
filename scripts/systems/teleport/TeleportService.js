import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_SPATIAL_MIGRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the execution of relocation 
 * vectors across the server's spatial dimensions. Manages a volatile 
 * memory-buffer (LAST_POS_STORE) for tracking back-anchors and 
 * death-coordinates.
 *
 * PHILOSOPHY: Migration must be precise. Use this service to execute 
 * validated teleportation and preserve spatial history for return-vectors.
 */

const LAST_POS_STORE = new Map() // VOLATILE_BACK_ANCHOR_REGISTRY

export const TeleportService = {
    /* 
     * RELOCATION_EXECUTION_VECTOR
     * Orchestrates the spatial-repositioning of an entity. Commits the 
     * entity's current coordinates to the back-anchor buffer before 
     * executing the migration.
     */
    teleport(player, destination, dimensionId = null) {
        if (!player.isValid) return false

        LAST_POS_STORE.set(player.id, {
            location: { ...player.location },
            dimensionId: player.dimension.id
        })

        try {
            player.teleport(destination, {
                dimension: dimensionId ? Kernel.world.getDimension(dimensionId) : player.dimension,
                keepVelocity: false
            })
            return true
        } catch (error) {
            console.error(`[TeleportService] MIGRATION_FAILURE: ${error}`)
            return false
        }
    },

    /* 
     * BACK_ANCHOR_QUERY
     */
    getLastPosition(playerId) {
        return LAST_POS_STORE.get(playerId) || null
    },

    /* 
     * SYSTEM_BOOTSTRAP_PROTOCOL
     * Initializes the death-location interception vector to preserve 
     * coordinates upon entity-termination.
     */
    init() {
        Kernel.world.afterEvents.entityDie.subscribe((event) => {
            if (event.deadEntity.typeId === "minecraft:player") {
                const player = event.deadEntity
                LAST_POS_STORE.set(player.id, {
                    location: { ...player.location },
                    dimensionId: player.dimension.id
                })
            }
        })
        console.log("[TeleportService] INDUSTRIAL_MIGRATION_BUS_ACTIVE");
    }
}
