/*
 * INDUSTRIAL_CONFIGURATION_MANIFEST
 * ----------------------------------------------------------------------------
 * The master manifest of global industrial parameters. Defines the 
 * operational boundaries of every sub-system within the AethelLib ecosystem. 
 *
 * PHILOSOPHY: Constants are immutable reality. Modifying these values 
 * recalibrates the entire empire's operational physics.
 */
export const Configuration = {
    /*
     * INTERFACE_TRIGGER_PARAMETERS
     * Defines the hardware identifier for the primary GUI injection.
     */
    MENU_ITEM_ID: "minecraft:compass",

    /*
     * SECURITY_AND_AUTHORITY_GATEWAYS
     * SUPER_ADMIN_TAGS: The 'GOD_ADMIN' identifiers. Possession of these 
     * tokens grants absolute bypass of all security-clearance nodes.
     *
     * DEFAULT_RANK_IDENTIFIER: The baseline role assigned to uncalibrated 
     * entity buffers.
     */
    SUPER_ADMIN_TAGS: ["Admin", "admin", "AE", "op"],
    DEFAULT_RANK: "member",

    /*
     * SPATIAL_MIGRATION_CONSTRAINTS
     * MAX_HOMES: Hard-limit on persistent spatial-anchor entries per UUID.
     * TPA_EXPIRATION_TTL: The lifespan of a spatial handshake before 
     * buffer-decommissioning (in seconds).
     */
    MAX_HOMES: 5,
    TPA_EXPIRATION: 60,

    /*
     * ECONOMIC_SUBSYSTEM_PARAMETERS
     * CURRENCY_SYMBOL: The string manifest for industrial liquidity.
     * STARTING_BALANCE: Initial credit injection for uncalibrated entities.
     */
    CURRENCY_SYMBOL: "$",
    STARTING_BALANCE: 1000,

    /*
     * SPATIAL_SECURITY_PROTOCOLS
     * DEFAULT_CLAIM_RADIUS: The standard acquisition footprint (chunks).
     * BANNED_ASSET_MANIFEST: Blacklisted items threatening structural integrity.
     * THREAT_ACTOR_MANIFEST: Entities classified as hostile for automated 
     * neutralization protocols.
     */
    DEFAULT_CLAIM_RADIUS: 1,
    BANNED_ITEMS: [
        "minecraft:lava_bucket", "minecraft:water_bucket", "minecraft:powder_snow_bucket",
        "minecraft:cod_bucket", "minecraft:salmon_bucket", "minecraft:pufferfish_bucket",
        "minecraft:tropical_fish_bucket", "minecraft:tadpole_bucket", "minecraft:axolotl_bucket",
        "minecraft:glow_squid_bucket", "minecraft:tnt"
    ],
    HOSTILE_MOBS: [
        "minecraft:zombie", "minecraft:husk", "minecraft:drowned", "minecraft:skeleton",
        "minecraft:stray", "minecraft:creeper", "minecraft:spider", "minecraft:cave_spider",
        "minecraft:enderman", "minecraft:endermite", "minecraft:witch", "minecraft:vindicator",
        "minecraft:evoker", "minecraft:pillager", "minecraft:ravager", "minecraft:illusioner",
        "minecraft:slime", "minecraft:magma_cube", "minecraft:phantom", "minecraft:guardian",
        "minecraft:elder_guardian", "minecraft:hoglin", "minecraft:zoglin"
    ]
}
