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
            color: "\xA76\xA7l",
            message: "is an absolute warrior with a {streak} kill streak!"
        },
        {
            min_streak: 25,
            rarity: "Rare",
            color: "\xA7d",
            message: "is on fire with a {streak} kill streak!"
        },
        {
            min_streak: 15,
            rarity: "Uncommon",
            color: "\xA7e",
            message: "is dominating with a {streak} kill streak!"
        },
        {
            min_streak: 5,
            rarity: "Common",
            color: "\xA7a",
            message: "is on a {streak} kill streak!"
        }
    ]
}
