/**
 * Rank Configuration - Data-Driven Rank Definitions
 * @Aethelgrad
 */

export const DEFAULT_RANKS = [
    {
        id: "member",
        name: "",
        order: 0,
        color: "gray",
        chatColor: "\xA77",
        permissions: {
            "home.limit": 3,
            "home.cooldown": 30, 
            "teleport.wait": 5,
            "command.cooldown": 3,
            "tpa.cooldown": 30,
            "warp.cooldown": 60,
            "essentials.help": true,
            "essentials.tps": true,
            "essentials.msg": true,
            "essentials.playerlist": true,
            "essentials.calculate": true,
            "essentials.info": true,
            "essentials.report": true,
            "essentials.credit": true,
            "essentials.whois": true,
            "essentials.rank": true,
            "essentials.claim": true,
            "essentials.tpa": true,
            "essentials.home": true,
            "essentials.warp": true,
            "essentials.spawn": true,
            "essentials.color": true
        }
    }
]
