import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: TPACancelCommand                                                 |
// | command definition for revoking an outgoing teleport handshake.           |
// | allows the requester to pull back their request before it is accepted.    |
// ----------------------------------------------------------------------------
export const TPACancelCommand = {
    // internal name.
    name: "tpacancel",
    // human-readable description.
    description: "Cancel outgoing TPA request",
    // syntax guide.
    usage: "/ae:tpacancel",
    // required permission level.
    permission: "essentials.tpa",
    // command category.
    category: "teleport",
    // native parameter definitions (optional target for specific cancellation).
    parameters: [
        { name: "target", type: "player", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | revocation pipeline. identifies the active outgoing request and purges it.|
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // resolve the handshake registry from the kernel.
        const TpaHandshake = Kernel.get("tpaHandshake")
        // find the most recent request sent by this player.
        const request = TpaHandshake.getLatestRequestFrom(player.id)
        
        // if no active requests exist.
        if (!request) {
            player.sendMessage("\xA7c\xA7l» \xA77You have no outgoing TPA requests.")
            return
        }

        // step 1: purge the request.
        TpaHandshake.removeRequest(request.id)
        // confirm to the sender.
        player.sendMessage(`\xA7a\xA7l» \xA7fTPA request to \xA7e${request.targetName} \xA7fcancelled.`)
        
        // step 2: target notification.
        // find the target player if they are still online.
        const target = [...Kernel.world.getAllPlayers()].find(p => p.id === request.targetId)
        if (target) {
            target.sendMessage(`\xA7c\xA7l» \xA7e${player.name} \xA77cancelled their TPA request.`)
        }
    }
}
