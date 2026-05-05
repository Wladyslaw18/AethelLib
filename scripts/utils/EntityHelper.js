import { system, world } from "@minecraft/server"

/*
 * INDUSTRIAL_ENTITY_DECOMMISSIONER
 * ----------------------------------------------------------------------------
 * A high-performance utility for the safe and certain removal of entities. 
 * Implements a 3-tier escalation protocol to ensure entity destruction 
 * even if standard native calls fail.
 *
 * PHILOSOPHY: If a component is no longer required, it must be purged. 
 * This module ensures the entity-buffer remains clean and optimized.
 */

/* 
 * 3-TIER_DECOMMISSION_PROTOCOL
 * Tier 1: Clean removal (native remove).
 * Tier 2: Force termination (native kill).
 * Tier 3: Reality severance (teleport to the void-buffer at Y-256).
 */
export function tryRemoveEntity(entity, options = {}) {
    if (!entity || !entity.isValid()) {
        return false
    }

    const { timeout = 0 } = options
    
    const removeEntity = () => {
        try {
            entity.remove()
            return true
        } catch (error1) {
            try {
                entity.kill()
                return true
            } catch (error2) {
                try {
                    entity.teleport({ x: entity.location.x, y: -256, z: entity.location.z })
                    return true
                } catch (error3) {
                    console.warn(`[EntityHelper] FATAL_PURGE_FAILURE for ${entity.typeId}:`, {
                        removeError: error1.message,
                        killError: error2.message,
                        teleportError: error3.message
                    })
                    return false
                }
            }
        }
    }

    if (timeout > 0) {
        system.runTimeout(() => {
            removeEntity()
        }, timeout)
        return true
    } else {
        return removeEntity()
    }
}

/* 
 * BATCH_DECOMMISSION_PIPELINE
 */
export function tryRemoveEntities(entities, options = {}) {
    if (!Array.isArray(entities)) {
        return 0
    }

    let removed = 0
    for (const entity of entities) {
        if (tryRemoveEntity(entity, options)) {
            removed++
        }
    }

    return removed
}

/* 
 * TYPE-SPECIFIC_PURGE_VECTOR
 */
export function removeEntitiesByType(entityType, center, radius, dimension = "overworld") {
    try {
        const dim = world.getDimension(dimension)
        const entities = dim.getEntities({
            type: entityType,
            location: center,
            maxDistance: radius
        })

        return tryRemoveEntities(entities, { reason: `Type_Cleanup: ${entityType}` })
    } catch (error) {
        console.error(`[EntityHelper] TYPE_PURGE_FAILURE for ${entityType}:`, error)
        return 0
    }
}

/* 
 * THREAT_ACTOR_PURGE_VECTOR
 * Targets entities within specific hostile family manifests for 
 * automated neutralization.
 */
export function removeHostileEntities(center, radius, dimension = "overworld") {
    try {
        const dim = world.getDimension(dimension)
        const entities = dim.getEntities({
            families: ["monster", "undead", "arthropod", "illager"],
            location: center,
            maxDistance: radius
        })

        return tryRemoveEntities(entities, { reason: "THREAT_ACTOR_NEUTRALIZATION" })
    } catch (error) {
        console.error("[EntityHelper] HOSTILE_PURGE_FAILURE:", error)
        return 0
    }
}

/* 
 * GROUND_ITEM_PURGE_VECTOR
 * Scans the spatial buffer for dropped item entities and decommissions them 
 * to reclaim performance cycles.
 */
export function removeGroundItems(center, radius, dimension = "overworld") {
    try {
        const dim = world.getDimension(dimension)
        const entities = dim.getEntities({
            type: "minecraft:item",
            location: center,
            maxDistance: radius
        })

        return tryRemoveEntities(entities, { reason: "ASSET_CLEANUP" })
    } catch (error) {
        console.error("[EntityHelper] ITEM_PURGE_FAILURE:", error)
        return 0
    }
}

/* 
 * PURGE_ELIGIBILITY_GATE
 * Ensures the system does not accidentally decommission protected 
 * entities or player buffers.
 */
export function canRemoveEntity(entity) {
    if (!entity || !entity.isValid()) {
        return false
    }

    if (entity.typeId === "minecraft:player") {
        return false
    }

    const protectedTags = ["protected", "essential", "system"]
    return !entity.getTags().some(tag => protectedTags.includes(tag))
}

/* 
 * PERFORMANCE-OPTIMIZED_BATCH_PURGE
 * Implements a segmented-execution strategy to perform large-scale 
 * entity decommissions without saturating the tick-budget.
 */
export async function batchRemoveEntities(entities, batchSize = 10) {
    let totalRemoved = 0
    let index = 0

    const processBatch = () => {
        return new Promise(resolve => {
            const batch = entities.slice(index, index + batchSize)
            let removed = 0

            for (const entity of batch) {
                if (tryRemoveEntity(entity)) {
                    removed++
                }
            }

            index += batchSize
            totalRemoved += removed
            resolve(removed)
        })
    }

    while (index < entities.length) {
        await processBatch()
        await new Promise(resolve => system.runTimeout(() => resolve(), 1))
    }

    return totalRemoved
}
