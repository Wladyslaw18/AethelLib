import { Kernel } from "../../../core/Kernel.js"
import { RankUI } from "../../../ui/social/ranks/RankUI.js"
import { RankSystem } from "../../../systems/social/ranks/RankSystem.js"
import { PlayerUtils } from "../../../utils/PlayerUtils.js"

/*
 * INDUSTRIAL_RANK_ADMIN_VECTORS
 * ----------------------------------------------------------------------------
 * Administrative command vectors for the orchestration of the global 
 * hierarchy-manifest.
 */

export const RankAdminCommands = [
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
    {
        name: "addranks",
        aliases: ["setrank"],
        description: "Assigns a rank to a player",
        usage: "/ae:addranks <player> <rankTag>",
        permission: "admin.ranks",
        category: "SOCIAL",
        execute(data, player, args) {
            if (args.length < 2) {
                player.sendMessage("§cUsage: /ae:addranks <player> <rankTag>")
                return
            }

            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)
            const rankTag = args.slice(consumedArgs).join(" ")

            if (!target) {
                player.sendMessage("§cPlayer not found.")
                return
            }

            const targetRank = RankSystem.getRank(rankTag);
            if (!targetRank) {
                player.sendMessage(`§cRank definition '${rankTag}' not found.`)
                return
            }

            // 🔥 HIERARCHY OVERRIDE PREVENTION
            const PermissionManager = Kernel.get("permissions");
            const executorRank = PermissionManager.getHighestRank(player);

            // If executor is not God (op) and tries to give a rank higher than their own
            if (!player.hasTag("op") && targetRank.order >= (executorRank?.order || 0)) {
                player.sendMessage(`§c§l» §7Security Fault: Cannot assign a rank equal to or higher than your own clearance.`);
                return;
            }

            target.addTag(rankTag)
            player.sendMessage(`§aSuccessfully assigned rank '${rankTag}' to ${target.name}.`)
            target.sendMessage(`§aYou have been assigned the rank: §e${rankTag}`)
            PermissionManager.invalidatePlayerCache(target.id)
        }
    },
    {
        name: "removeranks",
        aliases: ["delrank"],
        description: "Removes a rank from a player",
        usage: "/ae:removeranks <player> <rankTag>",
        permission: "admin.ranks",
        category: "SOCIAL",
        execute(data, player, args) {
            if (args.length < 2) {
                player.sendMessage("§cUsage: /ae:removeranks <player> <rankTag>")
                return
            }

            const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)
            const rankTag = args.slice(consumedArgs).join(" ")

            if (!target) {
                player.sendMessage("§cPlayer not found.")
                return
            }

            target.removeTag(rankTag)
            player.sendMessage(`§aSuccessfully removed rank '${rankTag}' from ${target.name}.`)
            target.sendMessage(`§cYour rank '${rankTag}' has been revoked.`)

            const PermissionManager = Kernel.get("permissions")
            PermissionManager.invalidatePlayerCache(target.id)
        }
    },
    {
        name: "deleteranks",
        aliases: ["purgerank"],
        description: "Purges a rank definition from the system",
        usage: "/ae:deleteranks <rankTag>",
        permission: "admin.ranks",
        category: "SOCIAL",
        execute(data, player, args) {
            if (args.length < 1) {
                player.sendMessage("§cUsage: /ae:deleteranks <rankTag>")
                return
            }

            const rankTag = args.join(" ")
            if (RankSystem.deleteRank(rankTag)) {
                Kernel.world.getAllPlayers().forEach(p => p.removeTag(rankTag));
                player.sendMessage(`§aSuccessfully purged rank definition: ${rankTag}`)
            } else {
                player.sendMessage(`§cFailed to purge rank: ${rankTag}. Check if tag exists.`)
            }
        }
    }
]
