/**
 * Rank Configuration - Data-Driven Rank Definitions
 * @Aethelgrad
 */

export const DEFAULT_RANKS = [
    {
        id: "member",
        name: "Member",
        order: 0,
        color: "gray",
        chatColor: "§7",
        permissions: {
            "home.limit": 3,
            "home.cooldown": 300, // 5 minutes
            "tpa.cooldown": 30,
            "warp.cooldown": 60
        }
    },
    {
        id: "vip",
        name: "VIP",
        order: 10,
        color: "green",
        chatColor: "§a",
        permissions: {
            "home.limit": 5,
            "home.cooldown": 180,
            "tpa.cooldown": 15,
            "warp.cooldown": 30
        }
    },
    {
        id: "mvp",
        name: "MVP",
        order: 20,
        color: "aqua",
        chatColor: "§b",
        permissions: {
            "home.limit": 10,
            "home.cooldown": 60,
            "tpa.cooldown": 0,
            "warp.cooldown": 0
        }
    },
    {
        id: "helper",
        name: "Helper",
        order: 40,
        color: "yellow",
        chatColor: "§e",
        permissions: {
            "chat.mute": true,
            "chat.unmute": true,
            "player.kick": true
        }
    },
    {
        id: "moderator",
        name: "Moderator",
        order: 50,
        color: "dark_aqua",
        chatColor: "§3",
        permissions: {
            "chat.mute": true,
            "chat.unmute": true,
            "player.kick": true,
            "player.ban": true,
            "player.freeze": true,
            "inventory.view": true
        }
    },
    {
        id: "admin",
        name: "Admin",
        order: 75,
        color: "red",
        chatColor: "§c",
        permissions: {
            "bypass.cooldown": true,
            "bypass.cost": true,
            "system.manage": true,
            "economy.manage": true,
            "land.manage": true
        }
    },
    {
        id: "owner",
        name: "Owner",
        order: 100,
        color: "dark_red",
        chatColor: "§4",
        permissions: {
            "*": true // Root permission
        }
    }
]
