/**
 * Global Constants - Frozen immutable configuration
 * Data-Oriented Design: Export as frozen objects for performance
 */

// Hostile mobs that should be removed from protected areas
const HOSTILE_MOBS = [
    "minecraft:zombie", "minecraft:husk", "minecraft:drowned", "minecraft:skeleton",
    "minecraft:stray", "minecraft:creeper", "minecraft:spider", "minecraft:cave_spider",
    "minecraft:enderman", "minecraft:endermite", "minecraft:witch", "minecraft:vindicator",
    "minecraft:evoker", "minecraft:pillager", "minecraft:ravager", "minecraft:illusioner",
    "minecraft:slime", "minecraft:magma_cube", "minecraft:phantom", "minecraft:guardian",
    "minecraft:elder_guardian", "minecraft:hoglin", "minecraft:zoglin"
]

// Hub configuration constants
const HUB_CONFIG = {
    DEFAULT_CENTER: { x: 9027, y: 100, z: 8978 },
    DEFAULT_RADIUS: 260,
    DEFAULT_SPAWN: { x: 9026.52, y: 236, z: 9033.47 },
    OVERWORLD: "overworld",
    BYPASS_TAGS: ["Admin", "admin", "AE"] // Admin tags with total power
}

// Admin tags with total power (all have same permissions)
const ADMIN_TAGS = ["Admin", "admin", "AE"]

// Banned items in hub area
const BANNED_ITEMS = [
    "minecraft:lava_bucket", "minecraft:water_bucket", "minecraft:powder_snow_bucket",
    "minecraft:cod_bucket", "minecraft:salmon_bucket", "minecraft:pufferfish_bucket",
    "minecraft:tropical_fish_bucket", "minecraft:tadpole_bucket", "minecraft:axolotl_bucket",
    "minecraft:glow_squid_bucket", "minecraft:tnt"
]

// System time constants
const TIME = {
    TICKS_PER_SECOND: 20,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
    MS_PER_SECOND: 1000,
    MS_PER_TICK: 50
}

// Permission levels
const PERMISSIONS = {
    DEFAULT: 0,
    MEMBER: 10,
    VIP: 20,
    MVP: 30,
    HELPER: 40,
    MODERATOR: 50,
    ADMIN: 100,
    OWNER: 200
}

// Export frozen objects for performance and immutability
export const Constants = Object.freeze({
    HOSTILE_MOBS: Object.freeze(HOSTILE_MOBS),
    HUB_CONFIG: Object.freeze(HUB_CONFIG),
    ADMIN_TAGS: Object.freeze(ADMIN_TAGS),
    BANNED_ITEMS: Object.freeze(BANNED_ITEMS),
    TIME: Object.freeze(TIME),
    PERMISSIONS: Object.freeze(PERMISSIONS)
})

// Individual exports for convenience
export { HOSTILE_MOBS, HUB_CONFIG, ADMIN_TAGS, BANNED_ITEMS, TIME, PERMISSIONS }
