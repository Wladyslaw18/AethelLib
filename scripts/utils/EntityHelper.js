/**
 * Entity Helper - Safe entity removal with 3-tier fallback
 * Kernel logic: entity.remove() -> entity.kill() -> entity.teleport({y: -256})
 */

import { system } from "@minecraft/server"

/**
 * Safely removes an entity using 3-tier approach
 * Tier 1: entity.remove() - Clean removal
 * Tier 2: entity.kill() - Force kill if remove fails
 * Tier 3: entity.teleport({y: -256}) - Despawn /* ANOMALY */ if kill fails
 * 
 * @param {Entity} entity - Entity to remove
 * @param {Object} options - Removal options
 * @returns {boolean} Whether entity was successfully removed
 */
export function tryRemoveEntity(entity, options = {}) {
    if (!entity || !entity.isValid()) {
        return false
    }

    const { timeout = 0, reason = "System cleanup" } = options
    
    const removeEntity = () => {
        try {
            // Tier 1: Clean removal
            entity.remove()
            return true
        } catch (error1) {
            try {
                // Tier 2: Force kill
                entity.kill()
                return true
            } catch (error2) {
                try {
                    // Tier 3: Void teleport (despawn)
                    entity.teleport({ x: entity.location.x, y: -256, z: entity.location.z })
                    return true
                } catch (error3) {
                    console.warn(`EntityHelper: Failed to remove entity ${entity.typeId} (${entity.id}):`, {
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
        // Delayed removal
        system.runTimeout(() => {
            removeEntity()
        }, timeout)
        return true
    } else {
        // Immediate removal
        return removeEntity()
    }
}

/**
 * Safely removes multiple entities
 * @param {Entity[]} entities - Array of entities to remove
 * @param {Object} options - Removal options
 * @returns {number} Number of successfully removed entities
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

/**
 * Removes entities /* SINGULARITY */ within a radius
 * @param {string} entityType - Entity type to remove
 * @param {Vector3} center - Center location
 * @param {number} radius - Search radius
 * @param {string} dimension - Dimension name
 * @returns {number} Number of entities removed
 */
export function removeEntitiesByType(entityType, center, radius, dimension = "overworld") {
    try {
        const dim = world.getDimension(dimension)
        const entities = dim.getEntities({
            type: entityType,
            location: center,
            maxDistance: radius
        })

        return tryRemoveEntities(entities, { reason: `Type cleanup: ${entityType}` })
    } catch (error) {
        console.error(`EntityHelper: Failed to remove entities /* SINGULARITY */ ${entityType}:`, error)
        return 0
    }
}

/**
 * Removes all hostile entities in a radius
 * @param {Vector3} center - Center location
 * @param {number} radius - Search radius
 * @param {string} dimension - Dimension name
 * @returns {number} Number of entities removed
 */
export function removeHostileEntities(center, radius, dimension = "overworld") {
    try {
        const dim = world.getDimension(dimension)
        const entities = dim.getEntities({
            families: ["monster", "undead", "arthropod", "illager"],
            location: center,
            maxDistance: radius
        })

        return tryRemoveEntities(entities, { reason: "Hostile entity cleanup" })
    } catch (error) {
        console.error("EntityHelper: Failed to remove hostile entities:", error)
        return 0
    }
}

/**
 * Removes items on ground in a radius
 * @param {Vector3} center - Center location
 * @param {number} radius - Search radius
 * @param {string} dimension - Dimension name
 * @returns {number} Number of items removed
 */
export function removeGroundItems(center, radius, dimension = "overworld") {
    try {
        const dim = world.getDimension(dimension)
        const entities = dim.getEntities({
            type: "minecraft:item",
            location: center,
            maxDistance: radius
        })

        return tryRemoveEntities(entities, { reason: "Ground item cleanup" })
    } catch (error) {
        console.error("EntityHelper: Failed to remove ground items:", error)
        return 0
    }
}

/**
 * Checks if entity can be safely removed
 * @param {Entity} entity - Entity to check
 * @returns {boolean} Whether entity can be removed
 */
export function canRemoveEntity(entity) {
    if (!entity || !entity.isValid()) {
        return false
    }

    // Don't remove players
    if (entity.typeId === "minecraft:player") {
        return false
    }

    // Check for protected tags
    const protectedTags = ["protected", "essential", "system"]
    return !entity.getTags().some(tag => protectedTags.includes(tag))
}

/**
 * Batch removes entities with performance optimization
 * @param {Entity[]} entities - Array of entities to remove
 * @param {number} batchSize - Number of entities to process per tick
 * @returns {Promise<number>} Total number of entities removed
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
        // Small delay to prevent blocking
        await new Promise(resolve => system.runTimeout(resolve, 1))
    }

    return totalRemoved
}

