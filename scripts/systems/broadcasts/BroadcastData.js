/**
 * Broadcast Data - Tiered message pools for the broadcast system
 * Data-Oriented Design: All pools and weights as frozen objects
 */

// Common messages (70% chance)
const COMMON_POOL = [
    "§cExploits or bugs used to gain an unfair advantage will result in punishment §7(and possible rollback of your progress).",
    "§cIf you find an exploit, report it to staff immediately - exploiting will not be tolerated.",
    "§cUsing third-party clients, cheats proxies, or known exploits may lead to a permanent ban.",
    "§cAttempting to abuse server mechanics, plugins, or grief protection will be investigated and punished.",

    "§6Use the compass to open the main menu and access teleport, homes, and features.",
    "§6Right-click the glowing compass to open the server menu for teleports and kits.",
    "§aNew players: speak with the NPCs at spawn for a starter kit and teleport options.",
    "§aVisit the spawn NPCs for a starter kit and safe teleport choices.",

    "§aType §b!help §ffor a full list of available commands.",
    "§aWant to save your build location? Type §b!sethome §r§7(name) §r§fto create a home.",

    "§cKeep the chat safe. Respect others and avoid offensive language.",
    "§cChat should remain friendly and safe for everyone - keep it clean.",
    "§cDo not share personal information (real name, address, phone, etc).",
    "§cProtect your privacy. Never share personal details in chat.",
    "§cStaff are not responsible for personal info shared in chat.",
    "§cBy using this system, you accept our disclaimer: we are not liable for information you choose to share.",

    "§aFound a rule breaker? Type §b!report <player> §fand our staff will review it.",
    "§aIf someone is breaking rules, use §b!report §fto alert the staff team.",

    "§7We do our best to keep the server stable, but occasional lag may occur. Thanks for understanding!",
    "§7Aethelgrad is community-driven and runs on limited resources - expect some lag or downtime.",

    "§cUsing alts to farm kits, hearts, or coins is against the rules.",
    "§cFair play keeps the game fun for everyone. Don't abuse alts.",

    "§aBuilders shape the world - save spots with §b!sethome §fto return quickly.",
    "§aFound a great build spot? Use §b!sethome §r§7(name) §r§fand come back anytime."
]

// Uncommon messages (20% chance)
const UNCOMMON_POOL = [
    "§6Lifesteal tip: winning PvP can grant hearts; respect the risk of dying.",
    "§6In Lifesteal, every PvP fight matters - wins give hearts, deaths cost them.",

    "§dJoin our §9Discord§f community: §ahttps://discord.gg/GCWHnpdjxt",
    "§dStay connected with players and staff on Discord: §ahttps://discord.gg/GCWHnpdjxt",
    "§dSubscribe on §cYouTube§f for updates: §ahttps://www.youtube.com/@Wladyslaw18",
    "§dWatch event highlights on §cYouTube§f: §ahttps://www.youtube.com/@Wladyslaw18",

    "§eInvite your friends - community events and giveaways are hosted often.",
    "§eMore players, more fun. Bring a friend and enjoy Aethelgrad together.",

    "§eWant to support the server? Donate and keep Aethelgrad running strong!",
    "§eEvery donation helps cover hosting and future updates - thank you!",

    "§aLike helping players? Join our Discord and apply to be a Helper!",
    "§aHelpers keep Aethelgrad safe & fun - apply today in our Discord!",

    "§ePlayers keep asking for updates... don't worry, it's cooking.",
    "§eNew features? Soon. When it's ready :p",

    "§eLove Aethelgrad? Tell your friends - more players, more fun!",
    "§eThe best way to support us is to play, share, and bring friends along.",

    "§eWant less lag? Support us - donations help us move to better hosting.",
    "§eEvery donation goes toward better hosting - less lag, more players, bigger updates.",

    "§eWant to help this server? Donate! Small contributions go a long way.",
    "§aQuick tip: §b!sethome §fsaves a spot, use §b!home §fto return quickly."
]

// Rare messages (8% chance)
const RARE_POOL = [
    "§6§lAethel§f§lgrad§r §7- §dMade /* ANOMALY */, for the community.",
    "§dTip of the day: Don't dig straight down. Unless you like lava baths.",
    "§dRumor says creepers are just shy... very, very explosive friends.",
    "§dServer fact: 100% of players who fell into the void regret their choices.",
    "§dReminder: Diamonds are not edible. (We checked.)",

    "§dLegends speak of treasures hidden around spawn. Explore carefully - secrets await.",
    "§dThe hub holds more than meets the eye... have you found the hidden treasures yet?",

    "§6Earn VIP /* OBSCURE */ §e1,000,000 coins§6 - then join our Discord to claim your reward!",
    "§6Have 1M coins? You may qualify for VIP. Visit our Discord to apply: §ahttps://discord.gg/GCWHnpdjxt",

    "§dSome say the darkness beyond the wild hides forgotten ruins.",
    "§dBeware the night... mobs grow stronger the farther you travel from spawn.",

    "§dWant a sneak peek of updates? Join Discord for developer notes and tests: §ahttps://discord.gg/GCWHnpdjxt",
    "§aWant to help this server? Donate or apply to be a Helper via our Discord: §ahttps://discord.gg/GCWHnpdjxt",
    "§6Want a VIP? Reach 1M coins then join Discord to claim your VIP perks."
]

// Legendary messages (2% chance) - Polish proverbs included
const LEGENDARY_POOL = [
    "§6§lAethelgrad Decree§r §7- §cWhen you are alone, you receive all the blame - but also all the truth.",
    "§6§lAethelgrad Decree§r §7- §cNo council. No excuses. Only responsibility.",
    "§6§lAethelgrad Decree§r §7- §4A kingdom built /* ENTROPY */ argues.§r §6One built alone decides.",
    "§6§lAethelgrad Decree§r §7- §cIf something breaks, the crown answers. If it works, silence follows.",
    "§6§lAethelgrad Decree§r §7- §6History remembers cities, not committees.",
    "§6§lAethelgrad Decree§r §7- §4Order is quiet. Chaos announces itself.",
    "§6§lAethelgrad Decree§r §7- §6Every rule here exists because someone once tried to abuse it.",
    "§6§lAethelgrad Decree§r §7- §cThis city stands because someone stayed when it was easier to quit.",
    "§6§lAethelgrad Decree§r §7- §6Aethelgrad is guarded by discipline, patience, and too little sleep.",
    "§6§lAethelgrad Decree§r §7- §4You are safe here not because it is perfect - but because it is watched.",

    "§6§lAethelgrad Decree§r §7- §6A light flashes in the dark. The engine still lives.",
    "§6§lAethelgrad Decree§r §7- §6In the dark of broken code, a light still flashes.",
    "§6§lAethelgrad Decree§r §7- §4The engine does not speak. §6It flashes.",
    "§6§lAethelgrad Decree§r §7- §6A light flashes in the dark. Someone stayed awake.",
    "§6§lAethelgrad Decree§r §7- §6A signal flashes in the dark. The system answers.",

    "§6§lAethelgrad Decree§r §7- §6Silny nie ten, kto krzyczy - lecz ten, kto trwa.",
    "§6§lAethelgrad Decree§r §7- §cKorona ciezka jest tylko dla tego, kto ja nosi."
]

// Rarity weights for random selection
const RARITY_WEIGHTS = {
    common: 70,
    uncommon: 20,
    rare: 8,
    legendary: 2
}

// Default configuration
const DEFAULT_CONFIG = {
    interval: 120, // 2 minutes in seconds
    pools: {
        common: COMMON_POOL,
        uncommon: UNCOMMON_POOL,
        rare: RARE_POOL,
        legendary: LEGENDARY_POOL
    },
    rarityWeights: RARITY_WEIGHTS
}

// Export frozen objects for performance and immutability
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

// Individual exports for convenience
export { COMMON_POOL, UNCOMMON_POOL, RARE_POOL, LEGENDARY_POOL, RARITY_WEIGHTS }

