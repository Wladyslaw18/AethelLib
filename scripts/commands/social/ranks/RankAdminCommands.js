import { Kernel } from "../../../core/Kernel.js"
import { RankUI } from "../../../ui/social/ranks/RankUI.js"
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js"
import { PlayerUtils } from "../../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | constant: RankAdminCommands                                              |
// | a collection of administrative vectors for the orchestration of the global|
// | hierarchy-manifest. handles creation, assignment, and revocation.         |
// ----------------------------------------------------------------------------
export const RankAdminCommands = [
    // --- Vector: createranks ---
    // Opens the visual creation engine for new rank nodes.
    {
        name: "createranks",
        aliases: ["crrank"],
        description: "Opens the rank creation interface",
        usage: "/ae:createranks",
        permission: "admin.ranks",
        category: "SOCIAL",
        async execute(data, player) {
            await RankUI.showCreateRank(player)
        }
    },
    // --- Vector: editranks ---
    // Opens the visual management dashboard for modifying existing rank definitions.
    {
        name: "editranks",
        aliases: ["edrank"],
        description: "Opens the rank management interface",
        usage: "/ae:editranks",
        permission: "admin.ranks",
        category: "SOCIAL",
        async execute(data, player) {
            await RankUI.showEditRanks(player)
        }
    },
    // --- Vector: addranks ---
    // Injects a rank tag into a player entity and invalidates their permission cache.
    {
        name: "addranks",
        aliases: ["setrank"],
        description: "Assigns a rank to a player",
        usage: "/ae:addranks <player> <rankTag>",
        permission: "admin.ranks",
        category: "SOCIAL",
        execute(data, player, args) {
            // syntax validation.
            if (args.length < 2) {
                player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:addranks <player> <rankTag>")
                return
            }

            // resolve the target and extract the rank identifier.
            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)
            const rankTag = args.slice(consumedArgs).join(" ")

            if (!target) {
                player.sendMessage("\xA7c\xA7l» \xA77Player not found.")
                return
            }

            // verify the rank actually exists in the global registry.
            const targetRank = RankSystem.getRank(rankTag);
            if (!targetRank) {
                player.sendMessage(`\xA7c\xA7l» \xA77Rank definition '${rankTag}' not found.`)
                return
            }

            // step 1: HIERARCHY OVERRIDE PREVENTION.
            // industrial safety check to prevent staff from assigning ranks 
            // above their own clearance.
            const PermissionManager = Kernel.get("permissions");
            const executorRank = PermissionManager.getHighestRank(player);

            // logic gate: if executor is not God (op tag) and target rank is more/equal powerful.
            if (!player.hasTag("op") && targetRank.order >= (executorRank?.order || 0)) {
                player.sendMessage(`\xA7c\xA7l» \xA77Security Fault: Cannot assign a rank equal to or higher than your own clearance.`);
                return;
            }

            // step 2: execution.
            // add the tag to the entity and flush their permission cache.
            target.addTag(rankTag)
            player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully assigned rank '${rankTag}' to ${target.name}.`)
            target.sendMessage(`\xA7a\xA7l» \xA7fYou have been assigned the rank: \xA7e${rankTag}`)
            PermissionManager.invalidatePlayerCache(target.id)
        }
    },
    // --- Vector: removeranks ---
    // Revokes a rank tag and updates the player's clearance level.
    {
        name: "removeranks",
        aliases: ["delrank"],
        description: "Removes a rank from a player",
        usage: "/ae:removeranks <player> <rankTag>",
        permission: "admin.ranks",
        category: "SOCIAL",
        execute(data, player, args) {
            if (args.length < 2) {
                player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:removeranks <player> <rankTag>")
                return
            }

            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)
            const rankTag = args.slice(consumedArgs).join(" ")

            if (!target) {
                player.sendMessage("\xA7c\xA7l» \xA77Player not found.")
                return
            }

            // execute revocation.
            target.removeTag(rankTag)
            player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully removed rank '${rankTag}' from ${target.name}.`)
            target.sendMessage(`\xA7c\xA7l» \xA77Your rank '${rankTag}' has been revoked.`)

            // purge the stale permission cache.
            const PermissionManager = Kernel.get("permissions")
            PermissionManager.invalidatePlayerCache(target.id)
        }
    },
    // --- Vector: deleteranks ---
    // Purges a rank definition from the world store and cascades removal to all players.
    {
        name: "deleteranks",
        aliases: ["purgerank"],
        description: "Purges a rank definition from the system",
        usage: "/ae:deleteranks <rankTag>",
        permission: "admin.ranks",
        category: "SOCIAL",
        execute(data, player, args) {
            if (args.length < 1) {
                player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:deleteranks <rankTag>")
                return
            }

            const rankTag = args.join(" ")
            // step 1: delete the definition from the store.
            if (RankSystem.deleteRank(rankTag)) {
                // step 2: cascade removal to every player currently tagged.
                Kernel.world.getAllPlayers().forEach(p => p.removeTag(rankTag));
                player.sendMessage(`\xA7a\xA7l» \xA7fSuccessfully purged rank definition: ${rankTag}`)
            } else {
                player.sendMessage(`\xA7c\xA7l» \xA77Failed to purge rank: ${rankTag}. Check if tag exists.`)
            }
        }
    }
]
