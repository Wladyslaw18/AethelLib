import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system, world } from "@minecraft/server"
import { isInCombat as isPlayerInCombat } from "../../systems/combat/CombatIntegrity.js"

/*
 * INDUSTRIAL_SPATIAL_ROLLBACK_VECTOR
 * ----------------------------------------------------------------------------
 * Orchestrates the relocation of an entity to its previous registered 
 * coordinate manifest. Implements an O(1) cooldown registry to prevent 
 * temporal-spamming and tactical-evasion.
 *
 * PHILOSOPHY: Rollbacks are stabilized for authenticated entities. If 
 * the spatial-buffer is corrupted or null, the reversion-vector 
 * cannot be initialized.
 */

const cooldowns = new Map() // TEMPORAL_RECHARGE_REGISTRY

export const BackCommand = {
    name: "back",
    description: "Executes a spatial-rollback to the latest registered coordinate-buffer.",
    usage: "!back",
    permission: "essentials.back",
    category: "GENERAL",

    /* 
     * EXECUTION_PIPELINE
     */
    execute(_data, player, _args) {
        /* COOLDOWN_HANDSHAKE */
        const cd = (RankSystem.getPermission(player, "back.cooldown") ?? 5) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (system.currentTick - last < cd) {
            player.sendMessage(`§cRECHARGE_REQUIRED: Vector stabilizing. Wait ${Math.ceil((cd - (system.currentTick - last)) / 20)}s.`);
            return
        }
        cooldowns.set(player.id, system.currentTick)

        const lastLocation = getLastLocation(player)
        if (!lastLocation) {
            player.sendMessage("§cERROR: SPATIAL_BUFFER_EMPTY: NO_ROLLBACK_TARGET_FOUND");
            return
        }

        /* COMBAT_INTEGRITY_PROBE */
        if (isInCombat(player)) {
            player.sendMessage("§cACCESS_DENIED: REVERSION_VECTOR_LOCKED_IN_COMBAT");
            return
        }

        /* MIGRATION_EXECUTION */
        system.run(() => {
            try {
                const dimension = world.getDimension(lastLocation.dimension)
                player.teleport(
                    { x: lastLocation.x + 0.5, y: lastLocation.y, z: lastLocation.z + 0.5 },
                    { dimension }
                )
                player.sendMessage("§aROLLBACK_SUCCESSFUL: Spatial coordinates restored.");
            } catch (error) {
                console.error(`[BackCommand] MIGRATION_FAILURE: ${error}`)
                player.sendMessage("§cERROR: SPATIAL_STABILIZATION_COLLAPSE");
            }
        })
    }
}

/* 
 * SPATIAL_MANIFEST_QUERY
 */
function getLastLocation(player) {
    try {
        const location = player.getDynamicProperty("ae:lastLocation")
        return location ? JSON.parse(location) : null
    } catch (error) {
        console.error(`[BackCommand] MANIFEST_LOAD_FAILURE: ${error}`)
        return null
    }
}

/* 
 * THREAT_STATUS_PROBE
 */
function isInCombat(player) {
    return isPlayerInCombat(player.id)
}

/* 
 * SPATIAL_SNAPSHOT_VECTOR
 */
world.afterEvents.playerSpawn.subscribe((event) => {
    if (event.initialSpawn) return
    const player = event.player
    const location = {
        x: Math.floor(player.location.x),
        y: Math.floor(player.location.y),
        z: Math.floor(player.location.z),
        dimension: player.dimension.id
    }
    try {
        player.setDynamicProperty("ae:lastLocation", JSON.stringify(location))
    } catch (error) {
        console.error(`[BackCommand] SNAPSHOT_COMMIT_FAILURE for ${player.name}: ${error}`)
    }
})
