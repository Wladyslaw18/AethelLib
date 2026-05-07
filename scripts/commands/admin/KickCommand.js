import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

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

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        if (args.length === 0) {
            player.sendMessage("[Manual] Syntax Error: Player identifier required.");
            return
        }

        const targetName = args[0]
        const reason = args.slice(1).join(" ") || "No reason specified"


        /* 
         * ENTITY_RESOLUTION
         */
        const target = world.getAllPlayers().find(p =>
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`§c§l» §7Player '${targetName}' not found.`);
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
        system.run(() => {
            try {
                player.runCommand(`kick "${target.name}" §c[KICK]\n§eREASON: ${reason}`)

                const kickMessage = `§6§l[§eKICK§6§l] §r${target.name} §7was kicked by §e${player.name}§7\n§7Reason: §f${reason}`


                world.getAllPlayers().forEach(p => {
                    if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                        p.sendMessage(kickMessage)
                    }
                })

                player.sendMessage(`§a§l» §f${target.name} has been kicked.`);

            } catch (error) {
                console.error(`[KickCommand] TERMINATION_CRASH for ${targetName}: ${error}`)
                player.sendMessage(`[Fatal] Severance failure for entity '${targetName}'.`);
            }
        })
    }
}
