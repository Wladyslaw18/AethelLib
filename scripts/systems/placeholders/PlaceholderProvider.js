import { Kernel } from "../../core/Kernel.js"

/*
 * INDUSTRIAL_PLACEHOLDER_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-performance resolution engine for dynamic string-tokens. 
 * Orchestrates a registry of {TOKEN} -> resolver-closures to facilitate 
 * real-time data-injection into visual manifests (FloatingText, Chat).
 *
 * PHILOSOPHY: Strings must be dynamic. Use this engine to manifest 
 * real-time server telemetry and entity-state data.
 */

/** @type {Map<string, (player?: import("@minecraft/server").Player) => string>} */
const registry = new Map() // TOKEN_RESOLVER_REGISTRY

let lastTickTime = Date.now()
let currentTPS = 20

export const PlaceholderProvider = {
    /* 
     * SYSTEM_BOOTSTRAP_PROTOCOL
     * Initializes the TPS-monitoring vector and injects built-in 
     * placeholder-nodes into the registry.
     */
    init() {
        Kernel.system.runInterval(() => {
            const now = Date.now()
            const delta = now - lastTickTime
            lastTickTime = now
            currentTPS = Math.round((currentTPS * 0.8) + ((1000 / Math.max(delta, 1)) * 0.2))
            currentTPS = Math.min(currentTPS, 20) 
        }, 1)

        this.registerPlaceholder("PlayerCount", () => {
            return String(Kernel.world.getAllPlayers().length)
        })

        this.registerPlaceholder("TPS", () => {
            return String(currentTPS)
        })

        this.registerPlaceholder("Online", () => {
            return Kernel.world.getAllPlayers().map(p => p.name).join(", ")
        })

        this.registerPlaceholder("PlayerName", (player) => {
            return player?.name || "UNKNOWN_ENTITY"
        })

        this.registerPlaceholder("Money", (player) => {
            if (!player) return "0"
            const EconomyStore = Kernel.get("economy")
            return String(EconomyStore.getBalance(player))
        })

        this.registerPlaceholder("Rank", (player) => {
            if (!player) return "NON_RANKED"
            const PermissionManager = Kernel.get("permissions")
            const rank = PermissionManager.getHighestRank(player)
            return rank?.name || "NON_RANKED"
        })
    },

    /* 
     * TOKEN_INJECTION_PROTOCOL
     */
    registerPlaceholder(key, resolver) {
        registry.set(key, resolver)
    },

    /* 
     * STRING_RESOLUTION_ENGINE
     * Performs a regex-based scan of the input-string and resolves 
     * recognized tokens using the registered closures.
     */
    resolve(text, player) {
        if (!text || !text.includes("{")) return text

        return text.replace(/\{(\w+)\}/g, (match, key) => {
            const resolver = registry.get(key)
            if (!resolver) return match 
            try {
                return resolver(player)
            } catch {
                return match
            }
        })
    },

    /* 
     * REGISTRY_QUERY_VECTOR
     */
    getPlaceholderKeys() {
        return Array.from(registry.keys())
    }
}
