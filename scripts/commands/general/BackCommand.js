import { Kernel } from "../../core/Kernel.js";
import { RankSystem } from "../../systems/social/ranks/RankSystem.js"
import { isInCombat as isPlayerInCombat } from "../../systems/combat/CombatIntegrity.js"

// ----------------------------------------------------------------------------
// | variable: cooldowns                                                      |
// | in-memory registry of player IDs and their last execution tick.          |
// | used to throttle command usage and prevent spam.                         |
// ----------------------------------------------------------------------------
const cooldowns = new Map()

// ----------------------------------------------------------------------------
// | object: BackCommand                                                      |
// | command definition for returning to a previous spatial coordinate.        |
// | commonly used after death or accidental teleportation.                   |
// ----------------------------------------------------------------------------
export const BackCommand = {
    // internal name.
    name: "back",
    // human-readable description.
    description: "Return to your previous location",
    // syntax guide.
    usage: "/ae:back",
    // required permission node.
    permission: "essentials.back",
    // command category.
    category: "GENERAL",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the spatial migration pipeline. handles cooldown checks, combat safety,   |
    // | and executes the actual dimension jump.                                  |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        // step 1: cooldown validation.
        // resolve the cooldown delay (default 5s) based on the player's rank.
        const cd = (RankSystem.getPermission(player, "back.cooldown") ?? 5) * 20
        const last = cooldowns.get(player.id) ?? 0
        // check if enough ticks have passed since the last use.
        if (Kernel.system.currentTick - last < cd) {
            const remaining = Math.ceil((cd - (Kernel.system.currentTick - last)) / 20)
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Please wait \u00A7e${remaining}s \u00A77before using this again.`);
            return
        }

        // update the last-used tick.
        cooldowns.set(player.id, Kernel.system.currentTick)

        // step 2: resolve the previous location.
        // this data is persisted in the player's private dynamic properties.
        const lastLocation = getLastLocation(player)
        if (!lastLocation) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77No previous location found.");
            return
        }

        // step 3: combat integrity probe.
        // prevents 'combat logging' or escaping PvP via teleportation.
        if (isInCombat(player)) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot teleport while in combat!");
            return
        }

        // step 4: migration execution.
        // wrap in Kernel.system.run to execute outside the command event chain.
        Kernel.system.run(() => {
            try {
                // resolve the target dimension object.
                const dimension = Kernel.world.getDimension(lastLocation.dimension)
                // perform the physical teleportation.
                // add 0.5 to x/z to center the player on the block.
                player.teleport(
                    { x: lastLocation.x + 0.5, y: lastLocation.y, z: lastLocation.z + 0.5 },
                    { dimension }
                )
                player.sendMessage("\u00A7a\u00A7l» \u00A7fTeleported back to your previous location.");
            } catch (error) {
                // if the dimension is no longer loaded or coords are invalid.
                player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to teleport back.");
            }
        })
    }
}

// ----------------------------------------------------------------------------
// | function: getLastLocation                                               |
// | fetches the spatial snapshot from the TeleportService.                  |
// ----------------------------------------------------------------------------
function getLastLocation(player) {
    try {
        const teleportService = Kernel.get("teleportService")
        if (!teleportService) return null
        
        const lastPos = teleportService.getLastPosition(player.id)
        if (!lastPos || !lastPos.location) return null
        
        return {
            x: lastPos.location.x,
            y: lastPos.location.y,
            z: lastPos.location.z,
            dimension: lastPos.dimensionId
        }
    } catch (error) {
        console.error(`[BackCommand] MANIFEST_LOAD_FAILURE: ${error}`)
        return null
    }
}

// ----------------------------------------------------------------------------
// | function: isInCombat                                                     |
// | interfaces with the combat integrity Kernel.system to check threat status.      |
// ----------------------------------------------------------------------------
function isInCombat(player) {
    return isPlayerInCombat(player.id)
}
