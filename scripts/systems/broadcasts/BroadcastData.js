/**
 * Broadcast Data - Tiered message pools for the broadcast system
 * Consistently purged to maintain industrial parity.
 */

// Common messages (40% chance) - General server info and reminders
const COMMON_POOL = [
    "\u00A7e\u00A7l\u00BB \u00A77Type \u00A7a/help \u00A77to see all available commands.",
    "\u00A7e\u00A7l\u00BB \u00A77Use \u00A7a/spawn \u00A77to return to the server spawn point.",
    "\u00A7e\u00A7l\u00BB \u00A77Join our Discord for news and events! \u00A7b/discord",
    "\u00A7e\u00A7l\u00BB \u00A77Vote for the server and earn rewards! \u00A7a/vote",
    "\u00A7e\u00A7l\u00BB \u00A77Protect your builds with \u00A7a/claim \u00A77and \u00A7a/land",
    "\u00A7e\u00A7l\u00BB \u00A77Check the time with \u00A7a/day \u00A77or \u00A7a/night",
    "\u00A7e\u00A7l\u00BB \u00A77New to the server? Type \u00A7a/rules \u00A77to get started.",
    "\u00A7e\u00A7l\u00BB \u00A77Report issues to staff using \u00A7a/report"
]

// Uncommon messages (30% chance) - Tips about commands, features, and economy
const UNCOMMON_POOL = [
    "\u00A7a\u00A7l\u00BB \u00A77Earn money by selling items at \u00A7a/shop \u00A77or \u00A7a/auction",
    "\u00A7a\u00A7l\u00BB \u00A77Set your home with \u00A7a/sethome \u00A77and teleport with \u00A7a/home",
    "\u00A7a\u00A7l\u00BB \u00A77Send money to other players with \u00A7a/pay",
    "\u00A7a\u00A7l\u00BB \u00A77Request a teleport to a friend with \u00A7a/tpa",
    "\u00A7a\u00A7l\u00BB \u00A77Mark your death location with \u00A7a/back \u00A77to return later",
    "\u00A7a\u00A7l\u00BB \u00A77Use \u00A7a/warp \u00A77to travel to public warp points",
    "\u00A7a\u00A7l\u00BB \u00A77Create a shop chest with \u00A7a/chestshop \u00A77to sell to others",
    "\u00A7a\u00A7l\u00BB \u00A77Check your balance anytime with \u00A7a/money"
]

// Rare messages (20% chance) - Lore-related, achievement-style messages
const RARE_POOL = [
    "\u00A75\u00A7l\u2726 \u00A7dThe ancient halls of Aethelgrad echo with the footsteps of legends.",
    "\u00A75\u00A7l\u2726 \u00A7dA great treasure lies hidden for those brave enough to seek it.",
    "\u00A75\u00A7l\u2726 \u00A7dThe Council of Elders watches over the realm from the high spires.",
    "\u00A75\u00A7l\u2726 \u00A7dA new champion has risen! May their deeds be etched in stone.",
    "\u00A75\u00A7l\u2726 \u00A7dTrade routes are thriving as merchants cross the kingdom.",
    "\u00A75\u00A7l\u2726 \u00A7dThe Forge of Aethelgrad burns bright with the fire of creation.",
    "\u00A75\u00A7l\u2726 \u00A7dBoundless horizons await those who dare to explore the unknown.",
    "\u00A75\u00A7l\u2726 \u00A7dUnity is the foundation upon which great empires are built."
]

// Legendary messages (10% chance) - Impactful proclamations and proverbs
const LEGENDARY_POOL = [
    "\u00A76\u00A7lAethelgrad Decree\u00A7r \u00A77- \u00A76Silny nie ten, kto krzyczy - lecz ten, kto trwa.",
    "\u00A76\u00A7lAethelgrad Decree\u00A7r \u00A77- \u00A7cKorona ciezka jest tylko dla tego, kto ja nosi.",
    "\u00A76\u00A7l\u2726 Royal Decree\u00A7r \u00A77- \u00A7eFortune favors the bold, but patience crowns the wise.",
    "\u00A76\u00A7l\u2726 Royal Decree\u00A7r \u00A77- \u00A7bThe strongest steel is forged in the hottest flame.",
    "\u00A76\u00A7l\u2726 Royal Proclamation\u00A7r \u00A77- \u00A7dEvery journey begins with a single step.",
    "\u00A76\u00A7l\u2726 Royal Proclamation\u00A7r \u00A77- \u00A7aA kingdom is only as strong as the bonds between its people."
]

// Rarity weights for random selection
const RARITY_WEIGHTS = {
    common: 40,
    uncommon: 30,
    rare: 20,
    legendary: 10
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
