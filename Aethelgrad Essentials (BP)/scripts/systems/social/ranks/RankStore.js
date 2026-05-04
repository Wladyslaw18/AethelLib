/**
 * Rank Store - ONE job: rank data storage
 */

import { Kernel } from "../../../core/Kernel.js"

export const RankStore = {
    /**
     * Get rank definition
     * @param {string} rankTag - Rank tag
     * @returns {Object|null} Rank data or null
     */
    getRank: (rankTag) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        return WorldStore.get(StoreKeys.rankDef(rankTag))
    },

    /**
     * Set rank definition
     * @param {string} rankTag - Rank tag
     * @param {Object} rankData - Rank data
     * @returns {boolean} Success status
     */
    setRank: (rankTag, rankData) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        return WorldStore.set(StoreKeys.rankDef(rankTag), rankData)
    },

    /**
     * Delete rank definition
     * @param {string} rankTag - Rank tag
     * @returns {boolean} Success status
     */
    deleteRank: (rankTag) => {
        const WorldStore = Kernel.get("worldStore")
        const StoreKeys = Kernel.get("keys")
        return WorldStore.delete(StoreKeys.rankDef(rankTag))
    },

    /**
     * Get all rank definitions
     * @returns {Object} Map of rank tags to rank data
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

    /**
     * Add rank to list
     * @param {string} rankTag - Rank tag
     * @returns {boolean} Success status
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

    /**
     * Remove rank from list
     * @param {string} rankTag - Rank tag
     * @returns {boolean} Success status
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
