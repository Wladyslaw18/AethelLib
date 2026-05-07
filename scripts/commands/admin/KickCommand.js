import { system } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

/*
 * Kick Command
 * ----------------------------------------------------------------------------
 * Handles kicking players from the server.
 */

export const KickCommand = {
    name: "kick",
    description: "Kick a player from the game",

    usage: "/ae:kick <player> [reason]",
    permission: "essentials.kick",
    category: "Admin",
    parameters: [
        { name: "player", type: "player", optional: false },
        { name: "reason", type: "string", optional: true }
    ],

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("§c§l» §7Usage: /ae:kick <player> [reason]");
            player.sendMessage("§e§l» §fTip: §7Provide a player name and optional reason.");
            return
        }

        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)
        const reason = args.slice(consumedArgs).join(" ") || "No reason specified"

        if (!target) {
            player.sendMessage(`§c§l» §7Player '${args[0]}' not found or is offline.`);
            return
        }


        /* 
         * HIERARCHY_VALIDATION_GATE
         */
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager.canActOn(player, target)) {
            player.sendMessage("§c§l» §7Permission Denied: Target is more powerful than you.");
            return
        }


        /* 
         * REALITY_SEVERANCE_HOOK
         */
        Kernel.system.run(() => {
            try {
                // INDUSTRIAL_TERMINATION_PROTOCOL
                // We use system.runCommand to ensure the kick executes with elevated administrative permissions.
                Kernel.system.runCommand(`kick \"${target.name}\" §c[KICK]\n§eREASON: ${reason.replace(/"/g, "'")}`)

                const kickMessage = `§6§l[§eKICK§6§l] §r${target.name} §7was kicked by §e${player.name}§7\n§7Reason: §f${reason}`


                Kernel.world.getAllPlayers().forEach(p => {
                    if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                        p.sendMessage(kickMessage)
                    }
                })

                player.sendMessage(`§a§l» §f${target.name} has been kicked.`);

            } catch (error) {
                console.error(`[KickCommand] TERMINATION_CRASH for ${target?.name ?? args[0]}: ${error}`)
                player.sendMessage(`§c§l» §7Severance failure for '${target?.name ?? args[0]}'.`);
            }
        })
    }
}

