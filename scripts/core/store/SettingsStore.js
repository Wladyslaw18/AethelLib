import { WorldStore } from "./WorldStore.js"

/**
 * SettingsStore - Centralized configuration management
 * ----------------------------------------------------------------------------
 * Persists all global system toggles and configuration strings.
 */

const DEFAULT_SETTINGS = {
    // Systems
    moneySystem: true,
    homeSystem: true,
    tpaSystem: true,
    warpSystem: true,
    backSystem: true,
    rtpSystem: true,
    shopSystem: true,
    sellSystem: true,
    auctionSystem: true,
    withdrawSystem: true,
    messageSystem: true,
    combatSystem: true,
    landSystem: true,
    
    // Configs
    starterMoney: "100",
    maxMoney: "1e+32",
    commandPrefix: "-",
    currencyPrefix: "$",
    earnMoneyfromMobs: true,
    RTPRange: "1000",
    tpaSystemWithUI: true,
    serverInfo: "Made by Wladyslaw",
    joinMessage: "Welcome to Aethelgrad!",
    showRankOnMessage: true,
    showRankOnNameTag: true,
    notifyEarnMoneyInChat: true
}

const STORAGE_KEY = "ae:settings"

export const SettingsStore = {
    DEFAULT_SETTINGS,
    /**
     * Get a setting value
     * @param {keyof typeof DEFAULT_SETTINGS} key 
     */
    get: (key) => {
        const settings = WorldStore.get(STORAGE_KEY) || {}
        return settings[key] !== undefined ? settings[key] : DEFAULT_SETTINGS[key]
    },

    /**
     * Set a setting value
     * @param {keyof typeof DEFAULT_SETTINGS} key 
     * @param {any} value 
     */
    set: (key, value) => {
        const settings = WorldStore.get(STORAGE_KEY) || {}
        settings[key] = value
        WorldStore.set(STORAGE_KEY, settings)
    },

    /**
     * Get all settings
     */
    getAll: () => {
        const settings = WorldStore.get(STORAGE_KEY) || {}
        return { ...DEFAULT_SETTINGS, ...settings }
    },

    /**
     * Update multiple settings
     */
    updateAll: (newSettings) => {
        const settings = WorldStore.get(STORAGE_KEY) || {}
        const merged = { ...settings, ...newSettings }
        WorldStore.set(STORAGE_KEY, merged)
    }
}
