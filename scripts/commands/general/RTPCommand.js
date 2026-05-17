import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | variable: cooldowns                                                      |
// | in-memory registry of player IDs and their last execution tick.          |
// | used to prevent spamming the heavy RTP search algorithm.                 |
// ----------------------------------------------------------------------------
const cooldowns = new Map()

// ----------------------------------------------------------------------------
// | object: RTPCommand                                                       |
// | command definition for random spatial migration.                          |
// | utilizes a background job to search for safe landing zones.               |
// ----------------------------------------------------------------------------
export const RTPCommand = {
    // internal name.
    name: "rtp",
    // human-readable description.
    description: "Teleport to a random safe location",
    // syntax guide.
    usage: "/ae:rtp [range]",
    // required permission node.
    permission: "essentials.rtp",
    // command category.
    category: "Teleport",
    // native parameter definitions.
    parameters: [
        { name: "range", type: "int", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the entry vector for random teleportation. handles range validation      |
    // | and triggers the asynchronous search job.                                |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // step 1: cooldown resolution.
        const PermissionManager = Kernel.get("permissions")
        const cd = (PermissionManager.getPermission(player, "rtp.cooldown") ?? 10) * 20
        const last = cooldowns.get(player.id) ?? 0
        if (Kernel.system.currentTick - last < cd) {
            player.sendMessage(`\xA7c\xA7l» \xA77Teleport on cooldown. Wait \xA7e${Math.ceil((cd - (Kernel.system.currentTick - last)) / 20)}s\xA77.`);
            return
        }

        // update cooldown pointer.
        cooldowns.set(player.id, Kernel.system.currentTick)

        // step 2: resolve range. default to 1000 blocks.
        const range = args[0] ? parseInt(args[0]) : 1000
        // safety constraints to prevent searching outside loaded world bounds.
        if (isNaN(range) || range < 100 || range > 10000) {
            player.sendMessage("\xA7c\xA7l» \xA77Range must be between 100 and 10000.");
            return
        }

        // step 3: combat status check.
        if (isInCombat(player)) {
            player.sendMessage("\xA7c\xA7l» \xA77Teleport disabled while in combat.");
            return
        }

        // feedback to the player.
        player.sendMessage("\xA76\xA7l» \xA7eFinding a safe spot...");

        // step 4: trigger the safe search job.
        findSafeLocation(player, range)
    }
}

// ----------------------------------------------------------------------------
// | function: findSafeLocation                                               |
// | initiates the random search sequence by offloading a generator job       |
// | to the kernel's scheduler.                                               |
// ----------------------------------------------------------------------------
async function findSafeLocation(player, maxRange) {
    const overworld = Kernel.world.getDimension("minecraft:overworld");
    const spawnLoc = Kernel.world.getDefaultSpawnLocation?.() || { x: 0, y: 0, z: 0 };
    
    // offload to the background job queue. 
    // this prevents the script from hanging the server while scanning blocks.
    Kernel.system.runJob(rtpGenerator(player, overworld, spawnLoc, maxRange));
}

// ----------------------------------------------------------------------------
// | function: rtpGenerator                                                   |
// | a time-slicing generator that scans for safe landing coordinates.        |
// | yields execution back to the engine every 10 Y-levels to maintain 20 TPS.|
// ----------------------------------------------------------------------------
function* rtpGenerator(player, dimension, spawnLocation, maxRange) {
    let attempts = 0;
    const maxAttempts = 20;

    // attempt to find a spot up to 20 times.
    while (attempts < maxAttempts) {
        attempts++;
        // calculate random radial coordinates around spawn.
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * maxRange;
        const x = Math.floor(spawnLocation.x + Math.cos(angle) * distance);
        const z = Math.floor(spawnLocation.z + Math.sin(angle) * distance);

        // scan vertically from the sky down to bedrock.
        for (let y = 320; y >= -64; y--) {
            // CRITICAL: yield every 10 levels. 
            // this allows the engine to process other tasks and keep the game smooth.
            if (y % 10 === 0) yield; 

            try {
                // fetch the block at the target coordinate.
                const block = dimension.getBlock({ x, y, z });
                if (!block) continue;

                // check the block above for suffocation hazards.
                const blockAbove = dimension.getBlock({ x, y: y + 1, z });
                if (!blockAbove) continue;

                // validation criteria: solid base block and air gap for the player.
                if (isSafeBlock(block.typeId) && blockAbove.typeId === "minecraft:air") {
                    // safe location found. execute the migration.
                    const location = { x: x + 0.5, y: y + 1, z: z + 0.5 };
                    
                    const TeleportService = Kernel.get("teleportService");
                    TeleportService.teleport(player, location, "minecraft:overworld");
                    player.sendMessage(`\xA7a\xA7l» \xA7fTeleported to \xA7e(${x}, ${y + 1}, ${z})\xA7f!`);
                    return; // exit generator.
                }
            } catch (e) { 
                // chunk might not be loaded yet. skip.
            }
        }
    }
    // if all attempts failed.
    player.sendMessage(`\xA7c\xA7l» \xA77Could not find a safe spot. Try again.`);
}

// ----------------------------------------------------------------------------
// | function: isSafeBlock                                                    |
// | whitelist of block identifiers that are safe to stand on.                |
// ----------------------------------------------------------------------------
function isSafeBlock(blockId) {
    const safeBlocks = [
        "minecraft:grass_block",
        "minecraft:dirt",
        "minecraft:sand",
        "minecraft:gravel",
        "minecraft:stone",
        "minecraft:cobblestone",
        "minecraft:snow_block",
        "minecraft:podzol",
        "minecraft:mycelium"
    ]
    return safeBlocks.includes(blockId)
}

// ----------------------------------------------------------------------------
// | function: isInCombat                                                     |
// | placeholder for combat integrity check.                                  |
// ----------------------------------------------------------------------------
function isInCombat(_player) {
    // TODO: Integrate with CombatIntegrity engine.
    return false
}
