/**
 * TPA Accept Command - Accept incoming TPA request
 * Smith Forge Rule: Max 100 lines per file
 */

import { Kernel } from "../../core/Kernel.js"

export const TPAcceptCommand = {
    name: "tpaccept",
    description: "Accept incoming TPA request",
    usage: "!tpaccept",
    permission: "essentials.tpa",
    category: "teleport",

    async execute(_data, player, _args) {
        const TpaService = Kernel.get("tpaService")
        TpaService.acceptRequest(player)
    }
}

