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
        if (identifier !== null && typeof identifier === 'object' && (typeof identifier.name === 'string' || typeof identifier.id === 'string' || typeof identifier.isValid === 'boolean')) {
            if (!identifier.isValid) {
                const activePlayer = Kernel.world.getAllPlayers().find(p => p.id === identifier.id);
                if (activePlayer) return Kernel.wrapEntity(activePlayer);
            }
            return Kernel.wrapEntity(identifier);
        }
        
        // ensure the input is a string.
        if (typeof identifier !== 'string') return null;

        // Clean quotes from the identifier if present (Bedrock quotes names with numbers/special chars)
        let cleanId = identifier.trim();
        if (cleanId.length >= 2) {
            const first = cleanId[0];
            const last = cleanId[cleanId.length - 1];
            if ((first === '"' || last === '"' || first === "'" || last === "'") && (first === last || cleanId.startsWith('"') && cleanId.endsWith('"') || cleanId.startsWith("'") && cleanId.endsWith("'"))) {
                // Strip the bounding quotes
                if ((first === '"' || first === "'") && first === last) {
                    cleanId = cleanId.slice(1, -1).trim();
                } else {
                    cleanId = cleanId.replace(/^['"]|['"]$/g, '').trim();
                }
            }
        }

        const lowerId = cleanId.toLowerCase()

        // step 1: O(1) lookup for exact name.
        let nameMatch = nameCache.get(lowerId)
        if (nameMatch && !nameMatch.isValid) {
            // Stale reference detected! Try to heal it from the active world players list.
            const activePlayer = Kernel.world.getAllPlayers().find(p => p.name.toLowerCase() === lowerId);
            if (activePlayer) {
                nameCache.set(lowerId, activePlayer);
                idToNameCache.set(activePlayer.id, lowerId);
                nameMatch = activePlayer;
            }
        }
        if (nameMatch?.isValid) return Kernel.wrapEntity(nameMatch)

        // step 2: look for an exact ID match.
        const foundName = [...idToNameCache.entries()].find(([id, _name]) => id === cleanId)
        if (foundName) {
            let p = nameCache.get(foundName[1])
            if (p && !p.isValid) {
                const activePlayer = Kernel.world.getAllPlayers().find(pl => pl.id === cleanId);
                if (activePlayer) {
                    const lowerName = activePlayer.name.toLowerCase();
                    nameCache.set(lowerName, activePlayer);
                    idToNameCache.set(activePlayer.id, lowerName);
                    p = activePlayer;
                }
            }
            if (p?.isValid) return Kernel.wrapEntity(p)
        }

        // step 3: fallback to exact name matching from active players list directly (bypasses stale cache)
        const activePlayers = Kernel.world.getAllPlayers()
        const exactMatch = activePlayers.find(p => p.name.toLowerCase() === lowerId)
        if (exactMatch) {
            nameCache.set(lowerId, exactMatch);
            idToNameCache.set(exactMatch.id, lowerId);
            return Kernel.wrapEntity(exactMatch);
        }

        // step 4: fallback to partial matching.
        // if a player's name contains the search string, return them.
        const partial = activePlayers.filter(p => p.name.toLowerCase().includes(lowerId))
        // only return if there is exactly one match. 
        if (partial.length === 1) return Kernel.wrapEntity(partial[0])

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
        const possiblePlayer = Array.isArray(args[0]) ? args[0][0] : args[0];
        if (typeof possiblePlayer === 'object' && possiblePlayer !== null && possiblePlayer.name) {
            let p = possiblePlayer;
            if (!p.isValid) {
                const activePlayer = Kernel.world.getAllPlayers().find(pl => pl.id === p.id);
                if (activePlayer) p = activePlayer;
            }
            return { player: Kernel.wrapEntity(p), consumedArgs: 1 }
        }

        // ✦ Quote parsing: detect if the first argument starts with a quote
        if (typeof args[0] === 'string' && (args[0].startsWith('"') || args[0].startsWith("'"))) {
            const quoteChar = args[0][0];
            let closingIndex = -1;
            for (let i = 0; i < args.length; i++) {
                if (i === 0 && args[i].length > 1 && args[i].endsWith(quoteChar)) {
                    closingIndex = 0;
                    break;
                } else if (i > 0 && args[i].endsWith(quoteChar)) {
                    closingIndex = i;
                    break;
                }
            }
            if (closingIndex !== -1) {
                const joined = args.slice(0, closingIndex + 1).join(" ");
                const stripped = joined.slice(1, -1);
                const target = this.findPlayer(stripped);
                if (target) {
                    return { player: Kernel.wrapEntity(target), consumedArgs: closingIndex + 1 };
                }
            }
        }

        let longestExactMatch = null
        let consumedExact = 0
        let longestPartialMatch = null
        let consumedPartial = 0

        // greedy matching. try to join as many words as possible to find a valid name.
        for (let i = 1; i <= args.length; i++) {
            const potentialName = args.slice(0, i).join(" ")
            const target = this.findPlayer(potentialName)
            
            if (target) {
                const isExact = target.name.toLowerCase() === potentialName.toLowerCase() || target.id === potentialName;
                if (isExact) {
                    longestExactMatch = target
                    consumedExact = i
                } else {
                    longestPartialMatch = target
                    consumedPartial = i
                }
            }
        }

        if (longestExactMatch) {
            return { player: Kernel.wrapEntity(longestExactMatch), consumedArgs: consumedExact }
        }

        return { player: Kernel.wrapEntity(longestPartialMatch), consumedArgs: consumedPartial }
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
        
        // 2. Query name-to-UUID index in O(1)
        try {
            const db = Kernel.get("database");
            const uuid = db ? db.get(`playername:${lowerName}`) : Kernel.world.getDynamicProperty(`playername:${lowerName}`);
            if (uuid) return uuid;

            // Fallback for pre-migration state only
            const isMigrated = db ? db.get("ae:index_migrated") : Kernel.world.getDynamicProperty("ae:index_migrated");
            if (!isMigrated) {
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
            }
        } catch (error) {
            console.error(`[PlayerUtils] getIdByName query failure: ${error}`);
        }
        
        return null;
    },

    registerMock(player) {
        const lowerName = player.name.toLowerCase();
        nameCache.set(lowerName, player);
        idToNameCache.set(player.id, lowerName);
    },

    unregisterMock(player) {
        const lowerName = player.name.toLowerCase();
        nameCache.delete(lowerName);
        idToNameCache.delete(player.id);
    },

    clearMocks() {
        for (const [id, lowerName] of idToNameCache.entries()) {
            if (id.startsWith("mock-id-") || id === "mock-player-id") {
                nameCache.delete(lowerName);
                idToNameCache.delete(id);
            }
        }
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

