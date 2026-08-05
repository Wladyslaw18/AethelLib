/*
 * GLOBAL_NAMESPACE_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Centralized key-factory for the AethelLib persistence layer. 
 *
 * PHILOSOPHY: Standardized naming conventions are mandatory to prevent 
 * catastrophic key-collisions in the world dynamic property buffer. 
 * Every entry must follow the 'DOMAIN:SUBDOMAIN:ID' hierarchy.
 */
export const StoreKeys = {
    /**
     * Keys associated with money balances.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * 
     * GUARANTEES:
     * - Returns Namespaced money key string.
     */
    money: (playerId) => `money:${playerId}`,

    /**
     * Keys associated with spatial homes.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * - name: Location name string.
     * 
     * GUARANTEES:
     * - Returns Namespaced home key string.
     */
    home: (playerId, name) => `home:${playerId}:${name}`,

    /**
     * Keys associated with player home lists.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * 
     * GUARANTEES:
     * - Returns Namespaced list key string.
     */
    homeList: (playerId) => `homeList:${playerId}`,

    /**
     * Keys associated with rank definitions.
     * 
     * EXPECTS:
     * - rankTag: Tag string of rank.
     * 
     * GUARANTEES:
     * - Returns Namespaced rank key string.
     */
    rankDef: (rankTag) => `rank:def:${rankTag}`,

    /**
     * Keys associated with global rank list.
     * 
     * GUARANTEES:
     * - Returns Namespaced rank list key string.
     */
    rankList: () => `rank:list`,

    /**
     * Keys associated with player bans.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * 
     * GUARANTEES:
     * - Returns Namespaced ban key string.
     */
    ban: (playerId) => `ban:${playerId}`,

    /**
     * Keys associated with player mutes.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * 
     * GUARANTEES:
     * - Returns Namespaced mute key string.
     */
    mute: (playerId) => `mute:${playerId}`,

    /**
     * Keys associated with warp locations.
     * 
     * EXPECTS:
     * - name: Warp key name.
     * 
     * GUARANTEES:
     * - Returns Namespaced warp key string.
     */
    warp: (name) => `warp:${name}`,

    /**
     * Keys associated with global warp lists.
     * 
     * GUARANTEES:
     * - Returns Namespaced warp list key string.
     */
    warpList: () => `warp:list`,

    /**
     * Keys associated with hub center spatial anchor.
     * 
     * GUARANTEES:
     * - Returns Hub center key string.
     */
    hubCenter: () => `hub:center`,

    /**
     * Keys associated with hub zone range bounds.
     * 
     * GUARANTEES:
     * - Returns Hub radius key string.
     */
    hubRadius: () => `hub:radius`,

    /**
     * Keys associated with hub banned items manifest.
     * 
     * GUARANTEES:
     * - Returns Hub banned items key string.
     */
    hubBannedItems: () => `hub:bannedItems`,

    /* 
     * SPATIAL_NPC_ANCHORS
     * Hard-coded pointers for the industrial hub entities.
     */
    npc: {
        hubCenter: () => `npc:hub:center`,
        hubSpawn: () => `npc:hub:spawn`,
        kitNPC: () => `npc:kit`,
        teleportNPC: () => `npc:teleport`
    },

    /* 
     * HARD_CODED_SPATIAL_CONSTANTS
     * Baseline coordinate data used as a failsafe if the database is purged.
     */
    defaultCoordinates: {
        HUB_CENTER: { x: 9027, y: 100, z: 8978 },
        HUB_SPAWN: { x: 9026.52, y: 236, z: 9033.47 }
    },

    /**
     * Keys associated with session first join date tracker.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * 
     * GUARANTEES:
     * - Returns Namespaced playtime key string.
     */
    firstJoin: (playerId) => `session:firstJoin:${playerId}`,

    /**
     * Keys associated with playtime counter.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * 
     * GUARANTEES:
     * - Returns Namespaced playtime count key string.
     */
    playtime: (playerId) => `session:playtime:${playerId}`,

    /**
     * Keys associated with last seen date tracker.
     * 
     * EXPECTS:
     * - playerId: Unique string identifier of player.
     * 
     * GUARANTEES:
     * - Returns Namespaced last seen key string.
     */
    lastSeen: (playerId) => `session:lastSeen:${playerId}`,
};
