import { Kernel } from "../../core/Kernel.js"

/**
 * Proximity-based Active Projection Engine for Floating Texts.
 * Spawns entities only when players are in range; culls them when they leave.
 * Resolves placeholder context based on the closest player.
 */

const RANGE = 32
const RANGE_SQ = RANGE * RANGE 
import { activeProjections } from "../floatingtext/FloatingTextService.js"
let lastUpdateTime = Date.now()

export function init() {
    Kernel.system.runInterval(() => {
        updateFloatingTexts()
    }, 20)
}

function updateFloatingTexts() {
    // 1. Passive TPS Tracking (Zero-overhead delta measurement)
    const now = Date.now()
    const delta = now - lastUpdateTime
    lastUpdateTime = now
    
    const calculatedTPS = Math.min(20, 20 * (1000 / Math.max(delta, 1)))
    const PlaceholderProvider = Kernel.get("placeholders")
    if (PlaceholderProvider) {
        PlaceholderProvider.setTPS(calculatedTPS)
    }

    const players = Kernel.world.getAllPlayers()
    const FloatingTextStore = Kernel.get("floatingTextStore")
    if (!FloatingTextStore) return

    const entries = FloatingTextStore.getAll()
    const dim = Kernel.world.getDimension("overworld")

    // 2. Active Proximity Scanning
    for (const entry of entries) {
        let closestPlayer = null
        let minDistanceSq = RANGE_SQ

        // Find the absolute closest player within distance threshold
        for (let i = 0; i < players.length; i++) {
            const player = players[i]
            const loc = player.location
            const dx = loc.x - entry.x
            const dy = loc.y - entry.y
            const dz = loc.z - entry.z
            const distSq = dx * dx + dy * dy + dz * dz

            if (distSq <= minDistanceSq) {
                minDistanceSq = distSq
                closestPlayer = player
            }
        }

        let entity = activeProjections.get(entry.id)

        if (closestPlayer) {
            try {
                // Spawn if missing or invalid
                if (!entity || !entity.isValid) {
                    entity = dim.spawnEntity(/** @type {any} */ ("ael:floating_text"), { x: entry.x, y: entry.y, z: entry.z })
                    activeProjections.set(entry.id, entity)
                }

                // Resolve and manifest dynamic placeholders with closest player's context
                const resolved = PlaceholderProvider ? PlaceholderProvider.resolve(entry.text, closestPlayer) : entry.text
                if (entity.nameTag !== resolved) {
                    entity.nameTag = resolved
                }

                // Ambient particle effect
                dim.spawnParticle("minecraft:basic_portal_particle", { x: entry.x, y: entry.y + 0.5, z: entry.z })
            } catch (error) {
                console.error(`Failed to project floating text ${entry.id}: ${error}`)
                activeProjections.delete(entry.id)
            }
        } else {
            // Cull if all players walked away
            if (entity) {
                try {
                    if (entity.isValid) {
                        entity.remove()
                    }
                } catch (e) {}
                activeProjections.delete(entry.id)
            }
        }
    }

    // 3. GC: Fast O(1) set-matching cleanup for deleted texts
    const entryIds = new Set(entries.map(e => e.id))
    for (const [entryId, entity] of activeProjections.entries()) {
        if (!entryIds.has(entryId)) {
            try {
                if (entity && entity.isValid) {
                    entity.remove()
                }
            } catch (e) {}
            activeProjections.delete(entryId)
        }
    }
}
