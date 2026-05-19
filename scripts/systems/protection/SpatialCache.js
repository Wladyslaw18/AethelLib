import { Kernel } from "../../core/Kernel.js";
import { ClaimStore } from "./ClaimStore.js";

// AUTH_CLEARANCE_BITMASKS matching ClaimService
const PERMISSIONS = {
    BUILD: 1,
    CONTAINERS: 2,
    DOORS: 4,
    REDSTONE: 8,
    MOB_INTERACT: 16,
    CRAFTING: 32
};

const ALL_PERMS = PERMISSIONS.BUILD | PERMISSIONS.CONTAINERS | PERMISSIONS.DOORS | PERMISSIONS.REDSTONE | PERMISSIONS.MOB_INTERACT | PERMISSIONS.CRAFTING;

/**
 * Volatile cache for chunk-based permissions.
 * Prevents redundant bit-shifting and key string generation on every block interaction.
 */
export const SpatialCache = {
    // Maps PlayerID -> { chunkKey: string, permissions: number }
    playerChunkStates: new Map(),

    init() {
        // Trace player coordinate updates at 20 ticks frequency
        Kernel.system.runInterval(() => {
            for (const player of Kernel.world.getAllPlayers()) {
                const currentKey = ClaimStore.locationToChunkKey(player.location);
                const cached = this.playerChunkStates.get(player.id);

                if (!cached || cached.chunkKey !== currentKey) {
                    const perms = this._resolvePermissions(currentKey, player.id);
                    this.playerChunkStates.set(player.id, {
                        chunkKey: currentKey,
                        permissions: perms
                    });
                }
            }
        }, 20);

        // Invalidate on player leave to keep memory pristine
        Kernel.world.afterEvents.playerLeave.subscribe((ev) => {
            this.playerChunkStates.delete(ev.playerId);
        });
    },

    _resolvePermissions(chunkKey, playerId) {
        const claim = ClaimStore.getClaim(chunkKey);
        if (!claim) return ALL_PERMS; // Unclaimed chunk is free domain
        if (claim.ownerId === playerId) return ALL_PERMS; // Owner gets everything
        return claim.trusted?.[playerId] || 0; // Trusted bitmask or 0
    },

    /**
     * Invalidate specific player cache or all caches on claim modification.
     */
    invalidate(playerId = null) {
        if (playerId) {
            this.playerChunkStates.delete(playerId);
        } else {
            this.playerChunkStates.clear();
        }
    },

    /**
     * Ultra-fast permission check using cached bitmasks.
     */
    hasPermission(player, location, requiredPermission) {
        const targetKey = ClaimStore.locationToChunkKey(location);
        const cached = this.playerChunkStates.get(player.id);

        if (cached && cached.chunkKey === targetKey) {
            return (cached.permissions & requiredPermission) === requiredPermission;
        }

        // Slow path fallback (e.g. interacting across chunk boundary)
        const perms = this._resolvePermissions(targetKey, player.id);
        return (perms & requiredPermission) === requiredPermission;
    },

    canBuild(player, location) {
        return this.hasPermission(player, location, PERMISSIONS.BUILD);
    }
};
