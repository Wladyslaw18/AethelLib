import { Kernel } from "../../../core/Kernel.js"

/** @typedef {import("@minecraft/server").Player} Player */

let initialized = false

export const RankSystem = {
    /**
     * Initialize rank system with default ranks
     */
    init: () => {
        if (initialized) return
        initialized = true

        const RankStore = Kernel.get("rankStore")

        // Create default ranks if they don't exist
        const defaultRanks = [
            {
                tag: "member",
                name: "Member",
                order: 0,
                colorText: "§7",
                colorName: "§7",
                hideRanks: false,
                permissions: {
                    "home.limit": 3,
                    "home.cooldown": 300000,
                    "home.cost": 0,
                    "tpa.cooldown": 30000,
                    "tpa.cost": 0,
                    "warp.cooldown": 60000,
                    "warp.cost": 0
                }
            },
            {
                tag: "vip",
                name: "VIP",
                order: 10,
                colorText: "§a",
                colorName: "§2",
                hideRanks: false,
                permissions: {
                    "home.limit": 5,
                    "home.cooldown": 180000,
                    "home.cost": 0,
                    "tpa.cooldown": 15000,
                    "tpa.cost": 0,
                    "warp.cooldown": 30000,
                    "warp.cost": 0
                }
            },
            {
                tag: "moderator",
                name: "Moderator",
                order: 50,
                colorText: "§b",
                colorName: "§3",
                hideRanks: false,
                permissions: {
                    "home.limit": 10,
                    "home.cooldown": 0,
                    "home.cost": 0,
                    "tpa.cooldown": 0,
                    "tpa.cost": 0,
                    "warp.cooldown": 0,
                    "warp.cost": 0,
                    "kick.use": true,
                    "mute.use": true
                }
            },
            {
                tag: "admin",
                name: "Admin",
                order: 75,
                colorText: "§c",
                colorName: "§4",
                hideRanks: false,
                permissions: {
                    "home.limit": -1,
                    "home.cooldown": 0,
                    "home.cost": 0,
                    "tpa.cooldown": 0,
                    "tpa.cost": 0,
                    "warp.cooldown": 0,
                    "warp.cost": 0,
                    "kick.use": true,
                    "mute.use": true,
                    "ban.use": true,
                    "economy.manage": true
                }
            }
        ]

        for (const rank of defaultRanks) {
            if (!RankStore.getRank(rank.tag)) {
                RankStore.setRank(rank.tag, rank)
                RankStore.addRankToList(rank.tag)
            }
        }

        // Add temp rank expiry interval
        Kernel.system.runInterval(() => {
            const now = Date.now()
            for (const player of Kernel.world.getAllPlayers()) {
                if (!player.isValid) continue
                try {
                    const raw = player.getDynamicProperty("ae:tempranks")
                    if (!raw) continue
                    const list = JSON.parse(String(raw))
                    const remaining = list.filter(r => {
                        if (now >= r.expiresAt) {
                            player.removeTag(String(r.tag));
                            return false
                        }
                        return true
                    })
                    player.setDynamicProperty("ae:tempranks", JSON.stringify(remaining))
                } catch (e) {
                    console.error("TempRank error:", e)
                }
            }
        }, 1200)
    },

    /**
     * Create a new rank
     * @param {string} tag - Rank tag
     * @param {Object} rankData - Rank data
     * @returns {boolean} Success status
     */
    createRank: (tag, rankData) => {
        const RankStore = Kernel.get("rankStore")
        if (!tag || !rankData) return false

        rankData.tag = tag
        const success = RankStore.setRank(tag, rankData)
        if (success) {
            RankStore.addRankToList(tag)
        }
        return success
    },

    /**
     * Update existing rank
     * @param {string} tag - Rank tag
     * @param {Object} rankData - Updated rank data
     * @returns {boolean} Success status
     */
    updateRank: (tag, rankData) => {
        const RankStore = Kernel.get("rankStore")
        if (!tag || !rankData) return false
        return RankStore.setRank(tag, rankData)
    },

    /**
     * Delete a rank
     * @param {string} tag - Rank tag
     * @returns {boolean} Success status
     */
    deleteRank: (tag) => {
        const RankStore = Kernel.get("rankStore")
        if (!tag) return false

        const success = RankStore.deleteRank(tag)
        if (success) {
            RankStore.removeRankFromList(tag)
        }
        return success
    },

    /**
     * Get rank data
     * @param {string} tag - Rank tag
     * @returns {Object|null} Rank data
     */
    getRank: (tag) => {
        const RankStore = Kernel.get("rankStore")
        return RankStore.getRank(tag)
    },

    /**
     * Get all ranks sorted by order
     * @returns {Object} Sorted ranks
     */
    getAllRanks: () => {
        const RankStore = Kernel.get("rankStore")
        const ranks = RankStore.getAllRanks()
        const sorted = {}

        Object.entries(ranks)
            .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
            .forEach(([tag, data]) => {
                sorted[tag] = data
            })

        return sorted
    },

    /**
     * Get permission value for a player
     * @param {Player} player - Player object
     * @param {string} key - Permission key
     * @returns {*} Permission value or null if not found
     */
    getPermission: (player, key) => {
        const RankStore = Kernel.get("rankStore")
        const sorted = player.getTags()
            .filter(tag => RankStore.getRank(tag) != null)
            .sort((a, b) => {
                const ra = RankStore.getRank(a)
                const rb = RankStore.getRank(b)
                return (ra?.order ?? 0) - (rb?.order ?? 0)
            })

        for (const tag of sorted) {
            const rank = RankStore.getRank(tag)
            if (rank?.permissions?.[key] !== undefined) return rank.permissions[key]

            // Check inherits chain
            if (rank?.inherits) {
                const parent = RankStore.getRank(rank.inherits)
                if (parent?.permissions?.[key] !== undefined) return parent.permissions[key]
            }
        }

        return null
    },

    /**
     * Add temporary rank to player
     * @param {Player} player - Player object
     * @param {string} tag - Rank tag
     * @param {number} durationMs - Duration in milliseconds
     * @returns {boolean} Success status
     */
    addTempRank: (player, tag, durationMs) => {
        const RankStore = Kernel.get("rankStore")
        if (!RankStore.getRank(tag)) return false

        player.addTag(tag)
        let list = []
        try {
            list = JSON.parse(String(player.getDynamicProperty("ae:tempranks") ?? "[]"))
        } catch { }

        list.push({ tag, expiresAt: Date.now() + durationMs })
        player.setDynamicProperty("ae:tempranks", JSON.stringify(list))
        return true
    }
}
