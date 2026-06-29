import { Kernel } from "../../core/Kernel.js"

/**
 * Updates floating text entities with resolved placeholders.
 * Only updates entities near players to save performance.
 */

const RANGE = 32
const RANGE_SQ = RANGE * RANGE 
const entityCache = new Map() // entryId -> Entity

/**
 * Start the update loop (every 20 ticks)
 */
export function init() {
    Kernel.system.runInterval(() => {
        updateFloatingTexts()
    }, 20)
}

/**
 * Main update loop for all floating text entries
 */
function updateFloatingTexts() {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) return

    const FloatingTextStore = Kernel.get("floatingTextStore")
    const entries = FloatingTextStore.getAll()
    if (entries.length === 0) return

    const dim = Kernel.world.getDimension("overworld")
    const PlaceholderProvider = Kernel.get("placeholders")

    // Pre-extract player locations to avoid multiple property access in the hot loop
    const playerLocs = players.map(p => p.location)

    for (const entry of entries) {
        /* SPATIAL_CULLING_CHECK (O(N*M) but light math) */
        let inRange = false
        for (let i = 0; i < playerLocs.length; i++) {
            const loc = playerLocs[i]
            const dx = loc.x - entry.x
            const dy = loc.y - entry.y
            const dz = loc.z - entry.z
            if ((dx * dx + dy * dy + dz * dz) <= RANGE_SQ) {
                inRange = true
                break
            }
        }

        if (!inRange) continue

        try {
            let entity = entityCache.get(entry.id)
            
            // CACHE_MISS_OR_INVALIDATION_PROTOCOL
            if (!entity || !entity.isValid) {
                const entities = dim.getEntities({
                    type: "ael:floating_text",
                    location: { x: entry.x, y: entry.y, z: entry.z },
                    maxDistance: 1
                })
                
                if (entities.length > 0) {
                    entity = entities[0]
                    entityCache.set(entry.id, entity)
                } else {
                    continue // Entity not found in world
                }
            }

            // RESOLUTION_AND_MANIFESTATION
            const resolved = PlaceholderProvider.resolve(entry.text, null)
            if (entity.nameTag !== resolved) {
                entity.nameTag = resolved
            }
        } catch (error) {
            // SILENT_REJECTION: Entity may be in a de-loaded sector.
            entityCache.delete(entry.id)
        }
    }
}

