/**
 * TPA Accept Command - Accept incoming TPA request
 * Smith Forge Rule: Max 100 lines per file
 */

import { Kernel } from "../../core/Kernel.js"

export const TPAcceptCommand = {
    name: "tpaccept",
    description: "Accept incoming TPA request",
    usage: "/ae:tpaccept",
    permission: "essentials.tpa",
    category: "teleport",
    parameters: [
        { name: "target", type: "player", optional: true }
    ],

    async execute(_data, player, _args) {
        const TpaService = Kernel.get("tpaService")
        TpaService.acceptRequest(player)
    }
}

