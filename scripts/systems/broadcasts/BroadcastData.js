/**
 * Broadcast Data - Tiered message pools for the broadcast system
 * Consistently purged to maintain industrial parity.
 */

// Common messages (70% chance) - PURGED
const COMMON_POOL = []

// Uncommon messages (20% chance) - PURGED
const UNCOMMON_POOL = []

// Rare messages (8% chance) - PURGED
const RARE_POOL = []

// Legendary messages (2% chance) - POLISH_PEAK_MANIFEST
const LEGENDARY_POOL = [
    "\u00A76\u00A7lAethelgrad Decree\u00A7r \u00A77- \u00A76Silny nie ten, kto krzyczy - lecz ten, kto trwa.",
    "\u00A76\u00A7lAethelgrad Decree\u00A7r \u00A77- \u00A7cKorona ciezka jest tylko dla tego, kto ja nosi."
]

// Rarity weights for random selection
const RARITY_WEIGHTS = {
    common: 0,
    uncommon: 0,
    rare: 0,
    legendary: 100
}

// Default configuration
const DEFAULT_CONFIG = {
    interval: 300, // 5 minutes in seconds
    pools: {
        common: COMMON_POOL,
        uncommon: UNCOMMON_POOL,
        rare: RARE_POOL,
        legendary: LEGENDARY_POOL
    },
    rarityWeights: RARITY_WEIGHTS
}

export const BroadcastData = Object.freeze({
    DEFAULT_CONFIG: Object.freeze(DEFAULT_CONFIG),
    POOLS: Object.freeze({
        common: Object.freeze(COMMON_POOL),
        uncommon: Object.freeze(UNCOMMON_POOL),
        rare: Object.freeze(RARE_POOL),
        legendary: Object.freeze(LEGENDARY_POOL)
    }),
    RARITY_WEIGHTS: Object.freeze(RARITY_WEIGHTS)
})

export { COMMON_POOL, UNCOMMON_POOL, RARE_POOL, LEGENDARY_POOL, RARITY_WEIGHTS }
