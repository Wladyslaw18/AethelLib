import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: KickCommand                                                      |
// | command definition for disconnecting a player from the server.            |
// | includes safety checks to prevent staff from kicking higher-ranked staff. |
// ----------------------------------------------------------------------------
export const KickCommand = {
    // internal name.
    name: "kick",
    // human-readable description.
    description: "Kick a player from the game",
    // syntax guide.
    usage: "/ae:kick <player> [reason]",
    // required permission node.
    permission: "essentials.kick",
    // command category.
    category: "Admin",
    // native parameter definitions.
    parameters: [
        { name: "player", type: "player", optional: false },
        { name: "reason", type: "string", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | processes the kick request.                                              |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // basic input validation.
        if (args.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:kick <player> [reason]");
            player.sendMessage("\xA7e\xA7l» \xA7fTip: \xA77Provide a player name and optional reason.");
            return
        }

        // resolve the target player object from the arguments.
        // handles names with spaces.
        const { player: target, consumedArgs } = PlayerUtils.resolveFromArgs(args)
        // the remaining arguments after the name are joined to form the reason.
        const reason = args.slice(consumedArgs).join(" ") || "No reason specified"

        // check if the target is actually online.
        if (!target) {
            player.sendMessage(`\xA7c\xA7l» \xA77Player '${args[0]}' not found or is offline.`);
            return
        }

        // step 1: hierarchy validation.
        // ask the permission service if the sender has authority over the target.
        // this prevents 'staff wars' where moderators try to kick each other.
        const PermissionManager = Kernel.get("permissions")
        if (PermissionManager && !PermissionManager.canActOn(player, target)) {
            player.sendMessage("\xA7c\xA7l» \xA77Permission Denied: Target is more powerful than you.");
            return
        }

        // step 2: reality severance.
        // use system.run to ensure the command executes outside the event chain.
        Kernel.system.run(() => {
            try {
                // execute the native engine kick command.
                // we escape double quotes in the reason to prevent command injection.
                Kernel.world.getDimension("overworld").runCommand(`kick \"${target.name}\" \xA7c[KICK]\n\xA7eREASON: ${reason.replace(/"/g, "'")}`)

                // build a notification message for other staff members.
                const kickMessage = `\xA76\xA7l[\xA7eKICK\xA76\xA7l] \xA7r${target.name} \xA77was kicked by \xA7e${player.name}\xA77\n\xA77Reason: \xA7f${reason}`

                // broadcast the kick notification to all players who have the notify permission.
                Kernel.world.getAllPlayers().forEach(p => {
                    if (PermissionManager.hasPermission(p, "essentials.admin.notify") || p.id === player.id) {
                        p.sendMessage(kickMessage)
                    }
                })

                // confirm to the sender that it worked.
                player.sendMessage(`\xA7a\xA7l» \xA7f${target.name} has been kicked.`);

            } catch (error) {
                // if the native kick fails, log it.
                console.error(`[KickCommand] TERMINATION_CRASH for ${target?.name ?? args[0]}: ${error}`)
                player.sendMessage(`\xA7c\xA7l» \xA77Severance failure for '${target?.name ?? args[0]}'.`);
            }
        })
    }
}
