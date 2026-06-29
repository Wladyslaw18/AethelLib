/**
 * TPA Deny Command - Deny incoming TPA request
 * Smith Forge Rule: Max 100 lines per file
 */

import { Kernel } from "../../core/Kernel.js"

export const TPAdenyCommand = {
    name: "tpadeny",
    description: "Deny incoming TPA request",
    usage: "/ae:tpadeny",
    permission: "essentials.tpa",
    category: "teleport",
    parameters: [
        { name: "target", type: "player", optional: true }
    ],

    async execute(_data, player, _args) {
        const TpaService = Kernel.get("tpaService")
        TpaService.denyRequest(player)
    }
}
