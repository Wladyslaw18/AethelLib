import { system, world } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"

/*
 * SESSION_TERMINATION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handles the administrative severance of an entity's session. Performs 
 * a hierarchy-validation check to resolve the power-delta between the 
 * administrator and the target before invoking the native kick protocol.
 *
 * PHILOSOPHY: If you're in the way, you're removed. This is the 
 * industrial equivalent of a garbage-collection cycle for non-compliant 
 * entities.
 */
export const KickCommand = {
    name: "kick",
    description: "Sever the industrial connection of a specific entity identifier.",
    usage: "!kick <player_identifier> [reason_manifest]",
    permission: "essentials.kick",
    category: "Admin",

    /* 
     * VECTOR_EXECUTION_PIPELINE
     */
    execute(data, player, args) {
        if (args.length === 0) {
            player.sendMessage("[Manual] Syntax Error: Player identifier required.");
            return
        }

        const targetName = args[0]
        const reason = args.slice(1).join(" ") || "ADMINISTRATIVE_TERMINATION"

        /* 
         * ENTITY_RESOLUTION
         */
        const target = world.getPlayers().find(p =>
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`[Error] Entity '${targetName}' not found in active buffer.`);
            return
        }

        /* 
         * HIERARCHY_VALIDATION_GATE
         */
        const PermissionManager = Kernel.get("permissions")
        if (!PermissionManager.canActOn(player, target)) {
            player.sendMessage("[Security] Authority Paradox: Target power-level exceeds actor clearance.");
            return
        }

        /* 
         * REALITY_SEVERANCE_HOOK
         */
        system.run(() => {
            try {
                target.runCommand(`kick "${target.name}" [TERMINATED]: ${reason}`)

                const kickMessage = `§6§l[§eTERMINATION§6§l] §r${target.name} §7WAS SEVERED BY §e${player.name}§7\n§7Reason: §f${reason}`

                world.getPlayers().forEach(p => {
                    if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                        p.sendMessage(kickMessage)
                    }
                })

                player.sendMessage(`[Success] Entity '${target.name}' connection severed.`);
            } catch (error) {
                console.error(`[KickCommand] TERMINATION_CRASH for ${targetName}: ${error}`)
                player.sendMessage(`[Fatal] Severance failure for entity '${targetName}'.`);
            }
        })
    }
}
