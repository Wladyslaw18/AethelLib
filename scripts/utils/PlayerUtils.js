import { Kernel } from "../core/Kernel.js";

// ----------------------------------------------------------------------------
// | PlayerUtils                                                              |
// | high-performance helper for finding player entities by name or id.       |
// | uses a memory-based cache to avoid scanning every entity on the server.  |
// ----------------------------------------------------------------------------

// in-memory map for name-based lookups. lower-case keys for case-insensitivity.
const nameCache = new Map() 
// helper map to find a name from a player id (used for cleanup on disconnect).
const idToNameCache = new Map() 

// add players to the cache as soon as they spawn.
Kernel.world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player } = ev
    const lowerName = player.name.toLowerCase()
    nameCache.set(lowerName, player)
    idToNameCache.set(player.id, lowerName)
})

// remove players when they leave so we don't hold onto dead object references.
Kernel.world.afterEvents.playerLeave.subscribe((ev) => {
    const { playerId } = ev
    // find the name associated with this id.
    const lowerName = idToNameCache.get(playerId)
    if (lowerName) {
        nameCache.delete(lowerName)
    }
    // clear the id mapping.
    idToNameCache.delete(playerId)
})

export const PlayerUtils = {
    // ----------------------------------------------------------------------------
    // | init                                                                     |
    // | populates the cache with players already on the server (for hot reloads).|
    // ----------------------------------------------------------------------------
    init() {
        Kernel.world.getAllPlayers().forEach(p => {
            const lowerName = p.name.toLowerCase()
            nameCache.set(lowerName, p)
            idToNameCache.set(p.id, lowerName)
        })
    },

    // ----------------------------------------------------------------------------
    // | findPlayer                                                               |
    // | tries to find a player object from a string identifier.                  |
    // | logic order:                                                             |
    // | 1. exact case-insensitive name match.                                    |
    // | 2. exact uuid/id match.                                                  |
    // | 3. partial name match (contains search).                                 |
    // ----------------------------------------------------------------------------
    findPlayer(identifier) {
        // bail if the query is empty.
        if (!identifier) return null
        
        // if the caller passed an object that is already a player, just give it back.
        if (identifier !== null && typeof identifier === 'object' && 'name' in identifier && 'id' in identifier) return identifier;
        
        // ensure the input is a string.
        if (typeof identifier !== 'string') return null;

        const lowerId = identifier.toLowerCase()

        // step 1: O(1) lookup for exact name.
        const nameMatch = nameCache.get(lowerId)
        // check .isValid to ensure the engine hasn't destroyed the entity yet.
        if (nameMatch?.isValid) return nameMatch

        // step 2: look for an exact ID match.
        const foundName = [...idToNameCache.entries()].find(([id, _name]) => id === identifier)
        if (foundName) {
            const p = nameCache.get(foundName[1])
            if (p?.isValid) return p
        }

        // step 3: fallback to partial matching.
        // if a player's name contains the search string, return them.
        const players = Kernel.world.getAllPlayers()
        const partial = players.filter(p => p.name.toLowerCase().includes(lowerId))
        // only return if there is exactly one match. 
        if (partial.length === 1) return partial[0]

        // nobody found.
        return null
    },

    // ----------------------------------------------------------------------------
    // | resolveFromArgs                                                          |
    // | specialized for commands. handles player names with spaces by trying     |
    // | increasingly longer combinations of arguments.                           |
    // ----------------------------------------------------------------------------
    resolveFromArgs(args) {
        if (!args || args.length === 0) return { player: null, consumedArgs: 0 }

        // if the native command parser already gave us a player object.
        if (typeof args[0] === 'object' && args[0] !== null && args[0].name) {
            return { player: args[0], consumedArgs: 1 }
        }

        let longestMatch = null
        let consumed = 0

        // greedy matching. try to join as many words as possible to find a valid name.
        for (let i = 1; i <= args.length; i++) {
            const potentialName = args.slice(0, i).join(" ")
            const target = this.findPlayer(potentialName)
            
            if (target) {
                longestMatch = target
                consumed = i
            }
        }

        return { player: longestMatch, consumedArgs: consumed }
    },

    // ----------------------------------------------------------------------------
    // | getIdByName                                                              |
    // | Inverse name lookup for offline/online players.                          |
    // ----------------------------------------------------------------------------
    getIdByName(name) {
        if (!name) return null;
        const lowerName = name.toLowerCase();
        
        // 1. Check in-memory caches for online players first
        const onlinePlayer = nameCache.get(lowerName);
        if (onlinePlayer?.isValid) {
            return onlinePlayer.id;
        }
        
        for (const [id, cachedName] of idToNameCache.entries()) {
            if (cachedName === lowerName) {
                return id;
            }
        }
        
        // 2. Scan DB for offline players (player:UUID:name)
        try {
            const allIds = Kernel.world.getDynamicPropertyIds();
            for (const propId of allIds) {
                if (propId.startsWith("player:") && propId.endsWith(":name")) {
                    const storedName = Kernel.world.getDynamicProperty(propId);
                    if (typeof storedName === "string" && storedName.toLowerCase() === lowerName) {
                        const parts = propId.split(":");
                        return parts[1]; // UUID
                    }
                }
            }
        } catch (error) {
            console.error(`[PlayerUtils] getIdByName query failure: ${error}`);
        }
        
        return null;
    }
}

// ----------------------------------------------------------------------------
// | garbage collection                                                       |
// | periodically sweep the caches for dead entities.                         |
// ----------------------------------------------------------------------------
Kernel.system.runInterval(() => {
    for (const [lowerName, player] of nameCache.entries()) {
        if (!player || !player.isValid) {
            nameCache.delete(lowerName)
            for (const [id, mappedName] of idToNameCache.entries()) {
                if (mappedName === lowerName) {
                    idToNameCache.delete(id)
                }
            }
        }
    }
}, 1200) // 1200 ticks = ~60 seconds

