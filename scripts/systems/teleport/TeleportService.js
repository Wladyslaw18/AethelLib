import { Kernel } from "../../core/Kernel.js"

/*
 * Teleport Service
 * ----------------------------------------------------------------------------
 * Handles all player teleportation, including delays, combat checks, 
 * and back-location tracking.
 */


const LAST_POS_STORE = new Map() // VOLATILE_BACK_ANCHOR_REGISTRY

export const TeleportService = {
    /* 
     * RELOCATION_EXECUTION_VECTOR
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
     * TEMPORAL_STABILIZATION_VECTOR
     * Executes a delayed teleportation with stability checks.
     */
    async teleportWithWait(player, destination, dimensionId, waitTime) {
        if (!player.isValid) return false
        
        const startPos = { x: player.location.x, y: player.location.y, z: player.location.z }
        
        for (let i = waitTime; i > 0; i--) {
            if (!player.isValid) return false
            
            player.onScreenDisplay.setActionBar(`§6§l» §eTeleporting in §f${i}s§e...`);

            
            // Wait 1 second (20 ticks)
            await new Promise(resolve => Kernel.system.runTimeout(() => resolve(), 20));

            // Stability Checks
            if (this._hasMoved(player, startPos)) {
                player.sendMessage("§c§l» §7Teleport cancelled: You moved!");
                return false
            }


            if (this._isInCombat(player)) {
                player.sendMessage("§c§l» §7Teleport cancelled: You are in combat!");
                return false
            }

        }

        return this.teleport(player, destination, dimensionId);
    },

    /* 
     * SPATIAL_DRIFT_PROBE
     */
    _hasMoved(player, startPos) {
        const dx = Math.abs(player.location.x - startPos.x)
        const dy = Math.abs(player.location.y - startPos.y)
        const dz = Math.abs(player.location.z - startPos.z)
        return dx > 0.5 || dy > 0.5 || dz > 0.5
    },

    /* 
     * COMBAT_SIGNATURE_PROBE
     */
    _isInCombat(player) {
        const CombatIntegrity = Kernel.get("combatIntegrity")
        return CombatIntegrity?.isInCombat(player.id) || false
    },

    getLastPosition(playerId) {
        return LAST_POS_STORE.get(playerId) || null
    },

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
        console.log("[TeleportService] Teleport Service online.");

    }
}
