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
        chatColor: "§7",
        permissions: {
            "home.limit": 3,
            "home.cooldown": 30, 
            "teleport.wait": 5,
            "command.cooldown": 3,
            "tpa.cooldown": 30,
            "warp.cooldown": 60,
            "essentials.help": true
        }
    }
]
