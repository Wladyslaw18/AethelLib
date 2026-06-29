import { Kernel } from "../../../core/Kernel.js"

/*
 * INDUSTRIAL_HIERARCHY_PERSISTENCE_ENGINE
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the persistence of industrial 
 * rank-definitions. Interfaces with the WorldStore to manage the global 
 * hierarchy-manifest and individual rank-node buffers.
 *
 * PHILOSOPHY: Hierarchy is the backbone of industrial order. Use this 
 * store to manifest and preserve the server's clearance-level definitions.
 */
export const RankStore = {
    /* 
     * HIERARCHY_NODE_QUERY
     */
    getRank: (rankTag) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        return WorldStore.get(StoreKeys.rankDef(rankTag))
    },

    /* 
     * HIERARCHY_NODE_COMMIT
     */
    setRank: (rankTag, rankData) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        return WorldStore.set(StoreKeys.rankDef(rankTag), rankData)
    },

    /* 
     * HIERARCHY_NODE_DECOMMISSION
     */
    deleteRank: (rankTag) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        return WorldStore.delete(StoreKeys.rankDef(rankTag))
    },

    /* 
     * GLOBAL_HIERARCHY_MANIFEST_QUERY
     * Scans the rank-registry and resolves all industrial rank-definitions 
     * into a single manifest-buffer.
     */
    getAllRanks: () => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        const rankList = WorldStore.get(StoreKeys.rankList()) || []
        const ranks = {}
        for (const rankTag of rankList) {
            ranks[rankTag] = WorldStore.get(StoreKeys.rankDef(rankTag))
        }
        return ranks
    },

    /* 
     * REGISTRY_INJECTION_PROTOCOL
     */
    addRankToList: (rankTag) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        const rankList = WorldStore.get(StoreKeys.rankList()) || []
        if (!rankList.includes(rankTag)) {
            rankList.push(rankTag)
            return WorldStore.set(StoreKeys.rankList(), rankList)
        }
        return true
    },

    /* 
     * REGISTRY_DE-REGISTRATION_PROTOCOL
     */
    removeRankFromList: (rankTag) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        const rankList = WorldStore.get(StoreKeys.rankList()) || []
        const index = rankList.indexOf(rankTag)
        if (index > -1) {
            rankList.splice(index, 1)
            return WorldStore.set(StoreKeys.rankList(), rankList)
        }
        return true
    }
}
