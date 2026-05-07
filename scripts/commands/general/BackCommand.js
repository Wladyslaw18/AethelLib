import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system, world } from "@minecraft/server"
import { isInCombat as isPlayerInCombat } from "../../systems/combat/CombatIntegrity.js"

/*
 * Back Command
 * ----------------------------------------------------------------------------
 * Teleports players back to their previous location (e.g. after death).
 */


const cooldowns = new Map() // TEMPORAL_RECHARGE_REGISTRY

export const BackCommand = {
    name: "back",
    description: "Return to your previous location",

    usage: "/ae:back",
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
            const remaining = Math.ceil((cd - (system.currentTick - last)) / 20)
            player.sendMessage(`§c§l» §7Please wait §e${remaining}s §7before using this again.`);
            return
        }

        cooldowns.set(player.id, system.currentTick)

        const lastLocation = getLastLocation(player)
        if (!lastLocation) {
            player.sendMessage("§c§l» §7No previous location found.");
            return
        }


        /* COMBAT_INTEGRITY_PROBE */
        if (isInCombat(player)) {
            player.sendMessage("§c§l» §7You cannot teleport while in combat!");
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
                player.sendMessage("§a§l» §fTeleported back to your previous location.");
            } catch (error) {
                player.sendMessage("§c§l» §7Failed to teleport back.");
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
