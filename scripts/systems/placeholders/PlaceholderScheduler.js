import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_PLACEHOLDER_SCHEDULER
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the periodic resolution and 
 * manifestation of dynamic strings on floating-text entities. Implements 
 * a spatial-culling strategy to minimize performance saturation in 
 * low-entity-density sectors.
 *
 * PHILOSOPHY: Display updates should only occur if an observer is present. 
 * Use the squared-range check to bypass expensive square-root operations 
 * in the hot-path.
 */

const RANGE = 32
const RANGE_SQ = RANGE * RANGE // SPATIAL_CULLING_THRESHOLD

/* 
 * SYSTEM_BOOTSTRAP_PROTOCOL
 * Initializes the temporal heartbeat for manifestation updates.
 */
export function init() {
    Kernel.system.runInterval(() => {
        updateFloatingTexts()
    }, 20)
}

/* 
 * MANIFESTATION_UPDATE_LOOP
 * Scans the industrial floating-text registry and executes the resolution 
 * vector for entities within the spatial-culling boundary.
 */
function updateFloatingTexts() {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) return

    const FloatingTextStore = Kernel.get("floatingTextStore")
    const entries = FloatingTextStore.getAll()
    if (entries.length === 0) return

    const dim = Kernel.world.getDimension("overworld")

    for (const entry of entries) {
        /* SPATIAL_CULLING_CHECK */
        const inRange = players.some(p => {
            const dx = p.location.x - entry.x
            const dy = p.location.y - entry.y
            const dz = p.location.z - entry.z
            return (dx * dx + dy * dy + dz * dz) <= RANGE_SQ
        })

        if (!inRange) continue

        try {
            const entities = dim.getEntities({
                type: "pao:floating_text",
                location: { x: entry.x, y: entry.y, z: entry.z },
                maxDistance: 1
            })

            for (const entity of entities) {
                if (!entity.isValid) continue
                const PlaceholderProvider = Kernel.get("placeholders")
                const resolved = PlaceholderProvider.resolve(entry.text, null)
                if (entity.nameTag !== resolved) {
                    entity.nameTag = resolved
                }
            }
        } catch (error) {
            /* SILENT_REJECTION: Entity may be in a de-loaded sector. */
        }
    }
}
