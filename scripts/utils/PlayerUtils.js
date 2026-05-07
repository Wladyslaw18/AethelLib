import { world } from "@minecraft/server"

/**
 * Utility for resolving player entities.
 * Uses a cached Map for O(1) lookups.
 */

const nameCache = new Map()
const idCache = new Map()

// Keep cache in sync
world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player } = ev
    nameCache.set(player.name.toLowerCase(), player)
    idCache.set(player.id, player)
})

world.afterEvents.playerLeave.subscribe((ev) => {
    const { playerId } = ev
    const p = idCache.get(playerId)
    if (p) nameCache.delete(p.name.toLowerCase())
    idCache.delete(playerId)
})

export const PlayerUtils = {
    /**
     * Initialize the cache with currently online players.
     */
    init() {
        world.getAllPlayers().forEach(p => {
            nameCache.set(p.name.toLowerCase(), p)
            idCache.set(p.id, p)
        })
    },

    /**
     * Resolves a name or ID to a Player object.

     * @param {string} identifier 
     * @returns {import("@minecraft/server").Player|null}
     */
    findPlayer(identifier) {
        if (!identifier) return null
        
        const lowerId = identifier.toLowerCase()

        // 1. Exact Name Match (O(1))
        const nameMatch = nameCache.get(lowerId)
        if (nameMatch?.isValid) return nameMatch

        // 2. ID Match (O(1))
        const idMatch = idCache.get(identifier)
        if (idMatch?.isValid) return idMatch

        // 3. Partial Match (Fallback O(N))
        const players = world.getAllPlayers()
        const partial = players.filter(p => p.name.toLowerCase().includes(lowerId))
        if (partial.length === 1) return partial[0]

        return null
    },

    /**
     * Specialized resolver for variable-length player names in commands.
     */
    resolveFromArgs(args) {
        if (args.length === 0) return { player: null, consumedArgs: 0 }

        let longestMatch = null
        let consumed = 0

        for (let i = 1; i <= args.length; i++) {
            const potentialName = args.slice(0, i).join(" ")
            const target = this.findPlayer(potentialName)
            
            if (target) {
                longestMatch = target
                consumed = i
            }
        }

        return { player: longestMatch, consumedArgs: consumed }
    }
}

