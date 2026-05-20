/**
 * Killstreak Configuration - Data-Driven Milestone Tiers
 * @Aethelgrad
 */

export const KILLSTREAK_CONFIG = {
    milestone_interval: 5,
    tiers: [
        {
            min_streak: 50,
            rarity: "Legendary",
            color: "\u00A76\u00A7l",
            message: "is an absolute warrior with a {streak} kill streak!"
        },
        {
            min_streak: 25,
            rarity: "Rare",
            color: "\u00A7d",
            message: "is on fire with a {streak} kill streak!"
        },
        {
            min_streak: 15,
            rarity: "Uncommon",
            color: "\u00A7e",
            message: "is dominating with a {streak} kill streak!"
        },
        {
            min_streak: 5,
            rarity: "Common",
            color: "\u00A7a",
            message: "is on a {streak} kill streak!"
        }
    ]
}
