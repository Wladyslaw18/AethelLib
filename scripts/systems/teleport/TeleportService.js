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

        if (!this._isLocationSafe(destination, dimensionId || player.dimension.id)) {
            player.sendMessage("\xA7c\xA7l» \xA77Teleport failed: Destination is unsafe!")
            return false
        }

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
     * SPATIAL_SAFETY_PROBE
     * Checks if the destination block is hazardous (lava/fire/void).
     */
    _isLocationSafe(location, dimensionId) {
        try {
            const dim = Kernel.world.getDimension(dimensionId)
            const block = dim.getBlock(location)
            if (!block) return true // Chunk not loaded, assume safe or let native handle
            
            const typeId = block.typeId
            if (typeId.includes("lava") || typeId.includes("fire")) return false
            if (location.y < -64) return false // Void check
            
            return true
        } catch {
            return true // Failsafe
        }
    },

    /* 
     * TEMPORAL_STABILIZATION_VECTOR
     * Executes a delayed teleportation with stability checks.
     */
    async teleportWithWait(player, destination, dimensionId, waitTime) {
        if (!player.isValid) return false
        
        const time = Math.max(0, parseInt(waitTime) || 0)
        const startPos = { x: player.location.x, y: player.location.y, z: player.location.z }
        
        for (let i = time; i > 0; i--) {
            if (!player.isValid) return false
            
            player.onScreenDisplay.setActionBar(`\xA76\xA7l» \xA7eTeleporting in \xA7f${i}s\xA7e...`);

            
            // Wait 1 second (20 ticks)
            await new Promise(resolve => Kernel.system.runTimeout(() => resolve(), 20));

            // Stability Checks
            if (this._hasMoved(player, startPos)) {
                player.sendMessage("\xA7c\xA7l» \xA77Teleport cancelled: You moved!");
                return false
            }


            if (this._isInCombat(player)) {
                player.sendMessage("\xA7c\xA7l» \xA77Teleport cancelled: You are in combat!");
                return false
            }

        }

        return new Promise(resolve => {
            Kernel.system.run(() => {
                const success = this.teleport(player, destination, dimensionId);
                resolve(success);
            });
        });
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
        Kernel.world.afterEvents.playerLeave.subscribe((event) => {
            LAST_POS_STORE.delete(event.playerId)
        })
        console.log("[TeleportService] Teleport Service online.");

    }
}
