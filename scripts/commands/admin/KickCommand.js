import { Kernel } from "../../core/Kernel.js"

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
    
    // NATIVE SCHEMA DEFINITION
    params: [
        { name: "player", type: Kernel.CustomCommandParamType.PlayerSelector, optional: false },
        { name: "reason", type: Kernel.CustomCommandParamType.String, optional: true }
    ],

    execute(_data, player, args) {
        // target is an actual rich Player object! reason is a C++ validated String!
        const [target, reason = "No reason specified"] = args;

        if (!target) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:kick <player> [reason]");
            return;
        }

        // step 1: hierarchy validation. verify target is not more powerful than sender.
        const PermissionManager = Kernel.get("permissions")
        if (PermissionManager && !PermissionManager.canActOn(player, target)) {
            player.sendMessage("\xA7c\xA7l» \xA77Permission Denied: Target is more powerful than you.");
            return
        }

        // step 2: execute kick command on nativeOverworld. escape double quotes to avoid injections.
        Kernel.system.run(() => {
            try {
                Kernel.world.getDimension("overworld").runCommand(`kick "${target.name}" \xA7c[KICK]\n\xA7eREASON: ${reason.replace(/"/g, "'")}`)

                const kickMessage = `\xA76\xA7l[\xA7eKICK\xA76\xA7l] \xA7r${target.name} \xA77was kicked by \xA7e${player.name}\xA77\n\xA77Reason: \xA7f${reason}`

                // broadcast kick alert to authorized staff.
                Kernel.world.getAllPlayers().forEach(p => {
                    if (PermissionManager?.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                        p.sendMessage(kickMessage)
                    }
                })

                player.sendMessage(`\xA7a\xA7l» \xA7f${target.name} has been kicked.`);

            } catch (error) {
                console.error(`[KickCommand] TERMINATION_CRASH for ${target?.name}: ${error}`)
                player.sendMessage(`\xA7c\xA7l» \xA77Severance failure for '${target?.name}'.`);
            }
        })
    }
}
