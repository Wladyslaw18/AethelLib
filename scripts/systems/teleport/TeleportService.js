import { Kernel } from "../../core/Kernel.js"

/*
 * Teleport Service
 * ----------------------------------------------------------------------------
 * Handles all player teleportation, including delays, combat checks, 
 * safe location probes, and back-location tracking.
 */

const LAST_POS_STORE = new Map() // VOLATILE_BACK_ANCHOR_REGISTRY

export const TeleportService = {
    /* 
     * RELOCATION_EXECUTION_VECTOR
     */
    teleport(player, destination, dimensionId = null) {
        if (!player || !player.isValid) return false
        const rawPlayer = player.__rawEntity__ || player;

        LAST_POS_STORE.set(rawPlayer.id, {
            location: { ...rawPlayer.location },
            dimensionId: rawPlayer.dimension.id
        })

        const targetDimId = dimensionId || rawPlayer.dimension.id;
        if (!this._isLocationSafe(destination, targetDimId)) {
            rawPlayer.sendMessage("\u00A7c\u00A7l» \u00A77Teleport failed: Destination is unsafe or invalid!");
            return false
        }

        try {
            const targetDim = Kernel.world.getDimension(targetDimId);
            if (!targetDim) {
                rawPlayer.sendMessage("\u00A7c\u00A7l» \u00A77Teleport failed: Target dimension is invalid.");
                return false;
            }
            rawPlayer.teleport(destination, {
                dimension: targetDim,
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
            if (!location || typeof location.y !== "number" || location.y < -64 || location.y > 320) return false;
            const dim = Kernel.world.getDimension(dimensionId)
            if (!dim) return false;
            if (!dim.isChunkLoaded(location)) return true;
            
            const block = dim.getBlock(location)
            if (!block) return true
            
            const typeId = block.typeId
            if (typeId.includes("lava") || typeId.includes("fire")) return false
            
            return true
        } catch {
            return false // Failsafe: deny on dimension or block query error
        }
    },

    /* 
     * TEMPORAL_STABILIZATION_VECTOR
     * Executes a delayed teleportation with stability checks.
     */
    async teleportWithWait(player, destination, dimensionId, waitTime) {
        if (!player || !player.isValid) return false
        const rawPlayer = player.__rawEntity__ || player;
        
        const time = Math.max(0, parseInt(waitTime) || 0)
        const startPos = { x: rawPlayer.location.x, y: rawPlayer.location.y, z: rawPlayer.location.z }
        
        for (let i = time; i > 0; i--) {
            if (!rawPlayer.isValid) return false
            
            rawPlayer.onScreenDisplay.setActionBar(`\u00A76\u00A7l» \u00A7eTeleporting in \u00A7f${i}s\u00A7e...`);

            // Wait 1 second (20 ticks)
            await new Promise(resolve => Kernel.system.runTimeout(() => resolve(), 20));

            // Stability Checks
            if (this._hasMoved(rawPlayer, startPos)) {
                rawPlayer.sendMessage("\u00A7c\u00A7l» \u00A77Teleport cancelled: You moved!");
                return false
            }

            if (this._isInCombat(rawPlayer)) {
                rawPlayer.sendMessage("\u00A7c\u00A7l» \u00A77Teleport cancelled: You are in combat!");
                return false
            }
        }

        return new Promise(resolve => {
            Kernel.system.run(() => {
                const success = this.teleport(rawPlayer, destination, dimensionId);
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
