import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: KickCommand                                                      |
// | disconnects a player from the server.                                     |
// | C++ PlayerSelector parses targets instantly. no more resolveFromArgs hacks!|
// ----------------------------------------------------------------------------
export const KickCommand = {
    name: "kick",
    description: "Kick a player from the game",
    usage: "/ae:kick <player> [reason]",
    permission: "essentials.kick",
    category: "Admin",
    // Intercepted by script for complex reason handling.
    native: false,
    
    // NATIVE SCHEMA DEFINITION
    params: [
        { name: "player", type: "player", optional: false },
        { name: "reason", type: "string", optional: true }
    ],

    execute(_data, player, args) {
        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args);
        const reason = args.slice(consumedArgs).join(" ") || "No reason specified";

        if (!target) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:kick <player> [reason]");
            return;
        }

        // step 1: hierarchy validation. verify target is not more powerful than sender.
        const PermissionManager = Kernel.get("permissions")
        if (PermissionManager && !PermissionManager.canActOn(player, target)) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Permission Denied: Target is more powerful than you.");
            return
        }

        // step 2: execute kick command on nativeOverworld. escape double quotes to avoid injections.
        Kernel.system.run(() => {
            try {
                Kernel.world.getDimension("overworld").runCommand(`kick "${target.name}" \u00A7c[KICK]\n\u00A7eREASON: ${reason.replace(/"/g, "'")}`)

                const kickMessage = `\u00A76\u00A7l[\u00A7eKICK\u00A76\u00A7l] \u00A7r${target.name} \u00A77was kicked by \u00A7e${player.name}\u00A77\n\u00A77Reason: \u00A7f${reason}`

                // broadcast kick alert to authorized staff.
                Kernel.world.getAllPlayers().forEach(p => {
                    if (PermissionManager?.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                        p.sendMessage(kickMessage)
                    }
                })

                player.sendMessage(`\u00A7a\u00A7l» \u00A7f${target.name} has been kicked.`);

            } catch (error) {
                console.error(`[KickCommand] TERMINATION_CRASH for ${target?.name}: ${error}`)
                player.sendMessage(`\u00A7c\u00A7l» \u00A77Severance failure for '${target?.name}'.`);
            }
        })
    }
}
