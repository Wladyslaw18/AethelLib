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
    /* FINANCIAL_DATA_IDENTIFIERS */
    money: (playerId) => `money:${playerId}`,

    /* SPATIAL_REGISTRY_POINTERS */
    home: (playerId, name) => `home:${playerId}:${name}`,
    homeList: (playerId) => `homeList:${playerId}`,

    /* AUTH_AND_ROLE_IDENTIFIERS */
    rankDef: (rankTag) => `rank:def:${rankTag}`,
    rankList: () => `rank:list`,

    /* SECURITY_ENFORCEMENT_POINTERS */
    ban: (playerId) => `ban:${playerId}`,
    mute: (playerId) => `mute:${playerId}`,

    /* GLOBAL_WARP_REGISTRY */
    warp: (name) => `warp:${name}`,
    warpList: () => `warp:list`,

    /* INDUSTRIAL_ZONE_PROTECTION_PARAMETERS */
    hubCenter: () => `hub:center`,
    hubRadius: () => `hub:radius`,
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

    /* SESSION_METRICS_IDENTIFIERS */
    firstJoin: (playerId) => `session:firstJoin:${playerId}`,
    playtime: (playerId) => `session:playtime:${playerId}`,
    lastSeen: (playerId) => `session:lastSeen:${playerId}`,
}
