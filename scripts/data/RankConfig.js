/**
 * Rank Configuration - Data-Driven Rank Definitions
 * @Aethelgrad
 */

export const DEFAULT_RANKS = [
    {
        id: "member",
        name: "\u00A77Member",
        order: -999,
        color: "gray",
        chatColor: "\u00A77",
        permissions: {
            "home.limit": 3,
            "home.cooldown": 30, 
            "teleport.wait": 5,
            "command.cooldown": 3,
            "tpa.cooldown": 30,
            "warp.cooldown": 60,
            "essentials.help": true,
            "essentials.tps": true,
            "essentials.message": true,
            "essentials.playerlist": true,
            "essentials.calculate": true,
            "essentials.info": true,
            "essentials.report": true,
            "essentials.credit": true,
            "essentials.rank": true,
            "essentials.claim": true,
            "essentials.tpa": true,
            "essentials.tpaccept": true,
            "essentials.tpadeny": true,
            "essentials.tpacancel": true,
            "essentials.tpahere": true,
            "essentials.home": true,
            "essentials.warp": true,
            "essentials.spawn": true,
            "essentials.chat.color": true,
            "essentials.pay": true,
            "essentials.money": true,
            "essentials.withdraw": true,
            "essentials.shop": true,
            "essentials.sell": true,
            "essentials.rtp": true,
            "essentials.back": true,
            "essentials.menu": true,
            "essentials.auction": true,
            "essentials.default": true
        }
    }
]
