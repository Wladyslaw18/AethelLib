/**
 * Back Command - Teleport to last location
 */

import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { system, world } from "@minecraft/server"

// Cooldown tracking
const cooldowns = new Map() // playerId → lastUsedTick

export const BackCommand = {
    name: "back",
    description: "Teleport to your last location",
    usage: "!back",
    permission: "essentials.back",
    category: "teleport",

    execute(data, player, args) {
        // Check cooldown
        const cd = (RankSystem.getPermission(player, "back.cooldown") ?? 5) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (system.currentTick - last < cd) {
            player.sendMessage(`§cPlease wait before using this again.`)
            return
        }
        cooldowns.set(player.id, system.currentTick)

        const lastLocation = getLastLocation(player.id)

        if (!lastLocation) {
            player.sendMessage("§cNo previous location to return to")
            return
        }

        // Check if player is in combat (placeholder for now)
        if (isInCombat(player)) {
            player.sendMessage("§cYou cannot use !back while in combat")
            return
        }

        // Perform teleport
        system.run(() => {
            try {
                const dimension = world.getDimension(lastLocation.dimension)
                player.teleport(
                    {
                        x: lastLocation.x + 0.5,
                        y: lastLocation.y,
                        z: lastLocation.z + 0.5
                    },
                    { dimension }
                )
                player.sendMessage(`§aTeleported to previous location`)
            } catch (error) {
                console.error(`Back teleport error: ${error}`)
                player.sendMessage("§cFailed to teleport back")
            }
        })
    }
}

function getLastLocation(playerId) {
    try {
        const location = player.getDynamicProperty("ae:lastLocation")
        return location ? JSON.parse(location) : null
    } catch (error) {
        console.error(`Failed to get last location: ${error}`)
        return null
    }
}

function isInCombat(player) {
    // Placeholder for combat check
    // Will integrate with CombatSystem when built
    return false
}

// Save location on player spawn/death
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
        console.error(`Failed to save last location: ${error}`)
    }
})

