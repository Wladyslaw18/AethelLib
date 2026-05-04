export const StoreKeys = {
    // Money
    money: (playerId) => `money:${playerId}`,

    // Homes
    home: (playerId, name) => `home:${playerId}:${name}`,
    homeList: (playerId) => `homeList:${playerId}`,

    // Ranks
    rankDef: (rankTag) => `rank:def:${rankTag}`,
    rankList: () => `rank:list`,

    // Bans
    ban: (playerId) => `ban:${playerId}`,

    // Mutes
    mute: (playerId) => `mute:${playerId}`,

    // Warps
    warp: (name) => `warp:${name}`,
    warpList: () => `warp:list`,

    // Hub
    hubCenter: () => `hub:center`,
    hubRadius: () => `hub:radius`,
    hubBannedItems: () => `hub:bannedItems`,

    // NPC Coordinates (salvaged from hubRules.js)
    npc: {
        hubCenter: () => `npc:hub:center`, // Default: { x: 9027, y: 100, z: 8978 }
        hubSpawn: () => `npc:hub:spawn`,   // Default: { x: 9026.52, y: 236, z: 9033.47 }
        kitNPC: () => `npc:kit`,           // Kit NPC location
        teleportNPC: () => `npc:teleport`   // Teleport NPC location
    },

    // Default NPC Coordinates
    defaultCoordinates: {
        HUB_CENTER: { x: 9027, y: 100, z: 8978 },
        HUB_SPAWN: { x: 9026.52, y: 236, z: 9033.47 }
    },

    // Session
    firstJoin: (playerId) => `session:firstJoin:${playerId}`,
    playtime: (playerId) => `session:playtime:${playerId}`,
    lastSeen: (playerId) => `session:lastSeen:${playerId}`,
}
