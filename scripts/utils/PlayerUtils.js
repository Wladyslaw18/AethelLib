import { world } from "@minecraft/server"

/**
 * Utility for resolving player entities.
 * Uses a cached Map for O(1) lookups.
 */

const nameCache = new Map() // lowerName -> Player
const idToNameCache = new Map() // playerId -> lowerName

// Keep cache in sync
world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player } = ev
    const lowerName = player.name.toLowerCase()
    nameCache.set(lowerName, player)
    idToNameCache.set(player.id, lowerName)
})

world.afterEvents.playerLeave.subscribe((ev) => {
    const { playerId } = ev
    const lowerName = idToNameCache.get(playerId)
    if (lowerName) {
        nameCache.delete(lowerName)
    }
    idToNameCache.delete(playerId)
})

export const PlayerUtils = {
    /**
     * Initialize the cache with currently online players.
     */
    init() {
        world.getAllPlayers().forEach(p => {
            const lowerName = p.name.toLowerCase()
            nameCache.set(lowerName, p)
            idToNameCache.set(p.id, lowerName)
        })
    },

    /**
     * Resolves a name or ID to a Player object.
     * @param {string} identifier 
     * @returns {import("@minecraft/server").Player|null}
     */
    findPlayer(identifier) {
        if (!identifier) return null
        
        // If it's already a player object, just return it
        if (identifier !== null && typeof identifier === 'object' && 'name' in identifier && 'id' in identifier) return identifier;
        if (typeof identifier !== 'string') return null;

        const lowerId = identifier.toLowerCase()

        // 1. Exact Name Match (O(1))
        const nameMatch = nameCache.get(lowerId)
        if (nameMatch?.isValid) return nameMatch

        // 2. ID Match (O(1)) - We check the idToNameCache then pull from nameCache
        const foundName = [...idToNameCache.entries()].find(([id, _name]) => id === identifier)
        if (foundName) {
            const p = nameCache.get(foundName[1])
            if (p?.isValid) return p
        }

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

        // If the native parser already resolved the player object
        if (typeof args[0] === 'object' && args[0] !== null && args[0].name) {
            return { player: args[0], consumedArgs: 1 }
        }

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
