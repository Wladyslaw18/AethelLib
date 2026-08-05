import { Kernel } from "../core/Kernel.js";

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

/**
 * Executes a 3-tier escalation destruction protocol to remove an entity.
 * 
 * EXPECTS:
 * - entity: Native Entity object (which may be invalid or dead).
 * - options: Configuration object.
 * - options.timeout: Optional ticks delay to defer destruction.
 * - options.force: If true, bypasses the canRemoveEntity check (default false).
 * 
 * GUARANTEES:
 * - Validates entity prior to processing.
 * - Checks canRemoveEntity unless options.force is true.
 * - Escalates through: Tier 1 (remove()), Tier 2 (kill()), Tier 3 (teleport to -64 void).
 * - Schedules execution using system.runTimeout if timeout > 0.
 * - Checks entity.isValid again inside the deferred timeout callback before removal.
 * - Returns true if entity was successfully marked/processed for removal, false otherwise.
 * 
 * @param {import("@minecraft/server").Entity} entity - Target entity.
 * @param {{timeout?: number, force?: boolean}} [options={}] - Config options.
 * @returns {boolean} True if removal succeeded or was scheduled.
 */
export function tryRemoveEntity(entity, options = {}) {
    if (!entity || !entity.isValid) {
        return false;
    }

    if (entity.typeId === "minecraft:player") {
        return false;
    }

    const { timeout = 0, force = false } = options;

    if (!force && !canRemoveEntity(entity)) {
        return false;
    }
    
    const removeEntity = () => {
        if (!entity || !entity.isValid) {
            return false;
        }
        try {
            entity.remove();
            return true;
        } catch (error1) {
            try {
                entity.kill();
                return true;
            } catch (error2) {
                try {
                    entity.teleport({ x: entity.location.x, y: -64, z: entity.location.z });
                    return true;
                } catch (error3) {
                    console.warn(`[EntityHelper] FATAL_PURGE_FAILURE for ${entity.typeId}:`, {
                        removeError: error1.message,
                        killError: error2.message,
                        teleportError: error3.message
                    });
                    return false;
                }
            }
        }
    };

    if (timeout > 0) {
        Kernel.system.runTimeout(() => {
            if (entity && entity.isValid) {
                removeEntity();
            }
        }, timeout);
        return true;
    } else {
        return removeEntity();
    }
}

/**
 * Removes a list of entities sequentially.
 * 
 * EXPECTS:
 * - entities: Array of Entity objects.
 * 
 * GUARANTEES:
 * - Iterates and triggers tryRemoveEntity on each item.
 * - Returns count of successfully removed entities.
 * 
 * @param {import("@minecraft/server").Entity[]} entities - List of entities.
 * @param {Object} [options={}] - Removal config options.
 * @returns {number} Count of removed entities.
 */
export function removeEntities(entities, options = {}) {
    if (!Array.isArray(entities)) {
        return 0;
    }

    let removedCount = 0;
    for (const entity of entities) {
        if (tryRemoveEntity(entity, options)) {
            removedCount++;
        }
    }

    return removedCount;
}

// Regression prevention alias mapping
export const tryRemoveEntities = removeEntities;

/**
 * Scans a volume and deletes entities matching a typeId.
 * 
 * EXPECTS:
 * - entityType: String typeId of the entity (e.g. "minecraft:zombie").
 * - center: Vector3 coordinates representing query volume center.
 * - radius: Number representing max query distance.
 * - dimension: String dimension identifier (default "overworld").
 * 
 * GUARANTEES:
 * - Validates center coordinate variables exist.
 * - Queries dimension and deletes matching entities.
 * - Returns count of removed entities.
 * 
 * @param {string} entityType - Entity type ID.
 * @param {import("@minecraft/server").Vector3} center - Center location.
 * @param {number} radius - Search radius.
 * @param {string} [dimension="overworld"] - Dimension key.
 * @returns {number} Removed entity count.
 */
export function removeEntitiesByType(entityType, center, radius, dimension = "overworld") {
    if (!center || typeof center.x !== "number" || typeof center.y !== "number" || typeof center.z !== "number") {
        console.error(`[EntityHelper] Invalid center coordinates for removeEntitiesByType:`, center);
        return 0;
    }

    try {
        const dim = Kernel.world.getDimension(dimension);
        const entities = dim.getEntities({
            type: entityType,
            location: center,
            maxDistance: radius
        });

        return removeEntities(entities, { reason: `Type_Cleanup: ${entityType}` });
    } catch (error) {
        console.error(`[EntityHelper] TYPE_PURGE_FAILURE for ${entityType}:`, error);
        return 0;
    }
}

/**
 * Queries a volume and neutralizes hostile entities matching generic monster families.
 * Fixes Bedrock Scripting API AND-intersection bug by running separate queries per family.
 * 
 * EXPECTS:
 * - center: Vector3 query center coordinates.
 * - radius: Search radius constraint.
 * - dimension: Dimension key (default "overworld").
 * 
 * GUARANTEES:
 * - Runs separate query queries for each hostile family type.
 * - Merges results using unique entity ID mappings (O(N) Set).
 * - Initiates removal sequence on resolved hostiles.
 * - Returns count of neutralized hostiles.
 */
export function removeHostileEntities(center, radius, dimension = "overworld") {
    if (!center || typeof center.x !== "number" || typeof center.y !== "number" || typeof center.z !== "number") {
        console.error(`[EntityHelper] Invalid center coordinates for removeHostileEntities:`, center);
        return 0;
    }

    try {
        const dim = Kernel.world.getDimension(dimension);
        const hostileFamilies = ["monster", "undead", "arthropod", "illager"];
        const uniqueEntities = new Map();

        for (const family of hostileFamilies) {
            const found = dim.getEntities({
                family: family,
                location: center,
                maxDistance: radius
            });
            for (const entity of found) {
                uniqueEntities.set(entity.id, entity);
            }
        }

        const entities = Array.from(uniqueEntities.values());
        return removeEntities(entities, { reason: "THREAT_ACTOR_NEUTRALIZATION" });
    } catch (error) {
        console.error("[EntityHelper] HOSTILE_PURGE_FAILURE:", error);
        return 0;
    }
}

/**
 * Scans volume and purges dropped items to reclaim heap space and ticks.
 */
export function removeGroundItems(center, radius, dimension = "overworld") {
    if (!center || typeof center.x !== "number" || typeof center.y !== "number" || typeof center.z !== "number") {
        console.error(`[EntityHelper] Invalid center coordinates for removeGroundItems:`, center);
        return 0;
    }

    try {
        const dim = Kernel.world.getDimension(dimension);
        const entities = dim.getEntities({
            type: "minecraft:item",
            location: center,
            maxDistance: radius
        });

        return removeEntities(entities, { reason: "ASSET_CLEANUP" });
    } catch (error) {
        console.error("[EntityHelper] ITEM_PURGE_FAILURE:", error);
        return 0;
    }
}

/**
 * Evaluates if an entity can be safely removed by cleaning scripts.
 * 
 * EXPECTS:
 * - entity: Target Entity.
 * 
 * GUARANTEES:
 * - Returns false if entity is invalid.
 * - Returns false if entity is a player.
 * - Returns false if entity has protected configuration tags (protected, essential, system).
 * - Safely wraps tag queries to prevent native invalid object exceptions.
 * - Returns true otherwise.
 * 
 * @param {import("@minecraft/server").Entity} entity - Target entity.
 * @returns {boolean} True if eligible for removal.
 */
export function canRemoveEntity(entity) {
    if (!entity || !entity.isValid) {
        return false;
    }

    if (entity.typeId === "minecraft:player") {
        return false;
    }

    const protectedTags = ["protected", "essential", "system"];
    try {
        const tags = entity.getTags();
        return !tags.some(tag => protectedTags.includes(tag));
    } catch (e) {
        // Safe check failed; do not delete unless forced
        return false;
    }
}

/**
 * Renders batch removal processing yielding ticks periodically to fit within the tick frame.
 * 
 * EXPECTS:
 * - entities: Array of entities to remove.
 * - batchSize: Count of items to process per tick (default 10).
 * 
 * GUARANTEES:
 * - Returns 0 if entities is not a valid array.
 * - Segments list and processes batches of batchSize sequentially.
 * - Yields control back to the game engine for 1 tick between segments.
 * - Returns total count of successfully removed entities.
 * 
 * @param {import("@minecraft/server").Entity[]} entities - List of entities.
 * @param {number} [batchSize=10] - Batch segment size.
 * @returns {Promise<number>} Total count of removed entities.
 */
export async function batchRemoveEntities(entities, batchSize = 10) {
    if (!Array.isArray(entities)) {
        return 0;
    }

    let totalRemovedCount = 0;
    let index = 0;

    const processBatch = () => {
        return new Promise(resolve => {
            const batch = entities.slice(index, index + batchSize);
            let removedCount = 0;

            for (const entity of batch) {
                if (tryRemoveEntity(entity)) {
                    removedCount++;
                }
            }

            index += batchSize;
            totalRemovedCount += removedCount;
            resolve(removedCount);
        });
    };

    while (index < entities.length) {
        await processBatch();
        await new Promise(resolve => Kernel.system.runTimeout(() => resolve(), 1));
    }

    return totalRemovedCount;
}
