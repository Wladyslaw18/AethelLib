import { system } from "@minecraft/server";

// ----------------------------------------------------------------------------
// | class: CacheManager                                                      |
// | a centralized memory buffering system.                                   |
// | keeps hot data in-memory so we don't have to keep hitting the slow disk. |
// | implements TTL (expiration) and LRU (size limit) eviction.               |
// ----------------------------------------------------------------------------
export class CacheManager {
    // ----------------------------------------------------------------------------
    // | static properties                                                        |
    // | global registry for all cache instances.                                  |
    // ----------------------------------------------------------------------------
    
    // holds the actual cache metadata (the maps, settings, stats).
    static #caches = new Map()
    // handle for the global cleanup timer that sweeps all caches.
    static #globalCleanupInterval = null
    
    // ----------------------------------------------------------------------------
    // | method: createCache                                                      |
    // | spawns a new isolated cache buffer with its own settings.                |
    // | sets up a background worker for that specific cache.                     |
    // ----------------------------------------------------------------------------
    /**
     * Spawns a new isolated cache buffer with its own settings.
     * 
     * EXPECTS:
     * - name: String identifier for the cache instance.
     * - options: Config object.
     * - options.ttl: Number of milliseconds to keep cached items valid.
     * - options.maxSize: Number of maximum items allowed in cache.
     * - options.cleanupInterval: Number of milliseconds between internal eviction checks.
     * 
     * GUARANTEES:
     * - Returns an object containing cache interface methods.
     * - Registers the cache instance within the global registry.
     * - Schedules an eviction timer using system.runInterval.
     * - Initiates the global cleanup worker if not already running.
     * 
     * DOES NOT PROMISE:
     * - Precise timing of memory eviction down to the millisecond.
     * 
     * @param {string} name Cache name.
     * @param {Object} [options={}] Configuration options.
     * @param {number} [options.ttl=5000] TTL duration.
     * @param {number} [options.maxSize=1000] Maximum capacity.
     * @param {number} [options.cleanupInterval=60000] Eviction interval.
     * @returns {Object} Cache instance interface.
     */
    static createCache(name, options = {}) {
        // the actual storage map.
        const cache = new Map()
        // Map to track access order. ES6 preserves insertion order, giving O(1) LRU eviction.
        const accessOrder = new Map() 
        // how long data stays valid (default 5 seconds, using nullish coalescing to support 0).
        const ttl = options.ttl ?? 5000 
        // maximum number of items allowed in the map (using nullish coalescing to support 0).
        const maxSize = options.maxSize ?? 1000
        // how often the background cleanup runs (default 1 minute).
        const cleanupInterval = options.cleanupInterval ?? 60000 
        
        // ----------------------------------------------------------------------------
        // | background cleanup                                                       |
        // | periodically clears out expired stuff and enforces size limits.           |
        // ----------------------------------------------------------------------------
        const cleanup = system.runInterval(() => {
            const cacheMeta = CacheManager.#caches.get(name)
            if (cacheMeta) {
                // local background cleanups now update deletes and cleanups stats
                const cleaned = CacheManager.#cleanupCache(cache, accessOrder, ttl, maxSize)
                if (cleaned > 0) {
                    cacheMeta.stats.cleanups++
                    cacheMeta.stats.deletes += cleaned
                }
            }
        }, Math.max(1, Math.floor(cleanupInterval / 50)))
        
        // save the metadata in our global registry.
        CacheManager.#caches.set(name, { 
            cache, 
            accessOrder, 
            cleanup, 
            options: { ttl, maxSize, cleanupInterval },
            // keep track of how well the cache is performing.
            stats: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                cleanups: 0
            }
        })
        
        // make sure the global cleanup worker is running.
        CacheManager.#startGlobalCleanup()
        
        // return the public interface for this cache.
        return {
            // ----------------------------------------------------------------------------
            // | get                                                                      |
            // | fetch a value. updates LRU stamp. deletes if expired.                    |
            // ----------------------------------------------------------------------------
            /**
             * Retrieves a value from the cache if present and not expired.
             * 
             * EXPECTS:
             * - key: String key to fetch.
             * 
             * GUARANTEES:
             * - Returns value if key exists and timestamp is within TTL.
             * - Returns null if key does not exist or has expired.
             * - Evicts the key immediately on access if it has expired.
             * - Updates access timestamp for LRU tracking on successful hits.
             * 
             * DOES NOT PROMISE:
             * - To keep the value in memory if LRU capacity is exceeded.
             * 
             * @param {string} key Entry key.
             * @returns {*} Cached value or null.
             */
            get: (key) => {
                // get the metadata for this cache.
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return null
                
                // try to find the entry.
                const entry = cacheMeta.cache.get(key)
                // check if it exists and hasn't expired yet.
                if (entry && Date.now() - entry.timestamp <= ttl) {
                    // update insertion order: delete and re-set key to move it to the end (MRU)
                    cacheMeta.accessOrder.delete(key)
                    cacheMeta.accessOrder.set(key, true)
                    // increment hit counter.
                    cacheMeta.stats.hits++
                    return entry.value ?? null
                }
                
                // if it exists but is expired, nuke it now.
                if (entry) {
                    cacheMeta.cache.delete(key)
                    cacheMeta.accessOrder.delete(key)
                    cacheMeta.stats.deletes++
                }
                
                // increment miss counter.
                cacheMeta.stats.misses++
                return null
            },
            
            // ----------------------------------------------------------------------------
            // | set                                                                      |
            // | adds a value. kicks out the oldest item if the cache is full.            |
            // ----------------------------------------------------------------------------
            /**
             * Adds or updates a value in the cache.
             * 
             * EXPECTS:
             * - key: String key to store.
             * - value: Any value to be cached.
             * 
             * GUARANTEES:
             * - Stores the value mapped to the key with a current timestamp.
             * - Evicts the least recently used (LRU) entry if capacity is reached.
             * - Updates access timestamp for LRU tracking.
             * 
             * DOES NOT PROMISE:
             * - To prevent eviction of newly added key if subsequent keys push it out.
             * 
             * @param {string} key Entry key.
             * @param {*} value Entry value.
             * @returns {void}
             */
            set: (key, value) => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return
                
                // check if we're at the limit and adding a NEW key.
                if (cacheMeta.cache.size >= maxSize && !cacheMeta.cache.has(key)) {
                    // kick out the least recently used item (O(1) first item in accessOrder map).
                    const evictedCount = CacheManager.#evictLRU(cacheMeta.cache, cacheMeta.accessOrder, 1)
                    cacheMeta.stats.deletes += evictedCount
                }
                
                // save the value with the current timestamp.
                cacheMeta.cache.set(key, { 
                    value, 
                    timestamp: Date.now() 
                })
                // update access order: delete and re-set key to move to the end (MRU)
                cacheMeta.accessOrder.delete(key)
                cacheMeta.accessOrder.set(key, true)
                // increment set counter.
                cacheMeta.stats.sets++
            },
            
            // remove a specific key.
            /**
             * Deletes a specific key and its metadata from the cache.
             * 
             * EXPECTS:
             * - key: String key to remove.
             * 
             * GUARANTEES:
             * - Removes the entry from the internal cache map.
             * - Removes the entry from the LRU access tracker.
             * - Returns true if the key existed and was deleted, false otherwise.
             * 
             * DOES NOT PROMISE:
             * - To execute callbacks or clean up values nested inside the entry.
             * 
             * @param {string} key Entry key.
             * @returns {boolean} True if deleted, false if not found.
             */
            delete: (key) => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return false
                
                const isDeleted = cacheMeta.cache.delete(key)
                cacheMeta.accessOrder.delete(key)
                
                if (isDeleted) {
                    cacheMeta.stats.deletes++
                }
                
                return isDeleted
            },
            
            // wipe everything.
            /**
             * Removes all entries from this cache instance.
             * 
             * EXPECTS:
             * - No arguments required.
             * 
             * GUARANTEES:
             * - Wipes all entries from the internal cache map.
             * - Clears the LRU access tracker.
             * 
             * DOES NOT PROMISE:
             * - To stop the background cleanup interval.
             * 
             * @returns {void}
             */
            clear: () => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return
                
                cacheMeta.cache.clear()
                cacheMeta.accessOrder.clear()
            },
            
            // ----------------------------------------------------------------------------
            // | invalidate                                                               |
            // | clear all keys that match a specific regex pattern.                      |
            // ----------------------------------------------------------------------------
            /**
             * Wipes cache entries matching a specified pattern.
             * 
             * EXPECTS:
             * - pattern: RegExp instance or string pattern to match against keys.
             * 
             * GUARANTEES:
             * - Evaluates pattern against all keys in the cache.
             * - Deletes matching keys from cache and LRU tracker.
             * - Returns the total count of deleted entries.
             * 
             * DOES NOT PROMISE:
             * - O(N) traversal overhead.
             * 
             * @param {string|RegExp} pattern Eviction pattern.
             * @returns {number} Count of invalidated entries.
             */
            invalidate: (pattern) => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return 0
                
                // convert string to regex if needed.
                const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)
                let invalidatedCount = 0
                
                // loop through every key. slow but effective.
                for (const [key] of cacheMeta.cache) {
                    if (regex.test(key)) {
                        cacheMeta.cache.delete(key)
                        cacheMeta.accessOrder.delete(key)
                        invalidatedCount++
                    }
                }
                
                cacheMeta.stats.deletes += invalidatedCount
                return invalidatedCount
            },
            
            // get performance metrics.
            /**
             * Returns performance metrics and details for this cache.
             * 
             * EXPECTS:
             * - No arguments required.
             * 
             * GUARANTEES:
             * - Returns stats object containing hit rate, size limits, and memory usage estimate.
             * 
             * DOES NOT PROMISE:
             * - Exact bytes representation of complex nested object values.
             * 
             * @returns {Object|null} Performance stats or null if destroyed.
             */
            getStats: () => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return null
                
                const totalRequests = cacheMeta.stats.hits + cacheMeta.stats.misses
                const hitRate = totalRequests > 0 ? 
                    Math.round((cacheMeta.stats.hits / totalRequests) * 100) : 0
                
                return {
                    ...cacheMeta.stats,
                    size: cacheMeta.cache.size,
                    maxSize,
                    hitRate,
                    // guess how much memory we're using.
                    memoryUsage: CacheManager.#estimateMemoryUsage(cacheMeta.cache)
                }
            },
            
            // check if a key exists and is valid.
            /**
             * Checks if a key exists in cache and is not expired.
             * 
             * EXPECTS:
             * - key: String key to check.
             * 
             * GUARANTEES:
             * - Returns true if key exists and has not expired.
             * - Returns false if key does not exist or has expired.
             * 
             * DOES NOT PROMISE:
             * - To update the access timestamp for LRU tracking.
             * 
             * @param {string} key Entry key.
             * @returns {boolean} Presence flag.
             */
            has: (key) => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return false
                
                const entry = cacheMeta.cache.get(key)
                return !!(entry && Date.now() - entry.timestamp <= ttl)
            },
            
            // get list of all keys.
            /**
             * Retrieves all keys stored in the cache.
             * 
             * EXPECTS:
             * - No arguments required.
             * 
             * GUARANTEES:
             * - Returns an array of string keys representing active cache entries.
             * 
             * DOES NOT PROMISE:
             * - Excludes keys that have expired but have not yet been evicted.
             * 
             * @returns {string[]} Array of keys.
             */
            keys: () => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return []
                
                return Array.from(cacheMeta.cache.keys())
            },
            
            // current size.
            /**
             * Gets the number of entries currently in the cache.
             * 
             * EXPECTS:
             * - No arguments required.
             * 
             * GUARANTEES:
             * - Returns the size of the internal map.
             * 
             * DOES NOT PROMISE:
             * - Excludes keys that have expired but have not yet been swept.
             * 
             * @returns {number} Count of entries.
             */
            size: () => {
                const cacheMeta = CacheManager.#caches.get(name)
                return cacheMeta ? cacheMeta.cache.size : 0
            },
            
            // get memory footprint in bytes.
            /**
             * Computes an estimated memory footprint in bytes.
             * 
             * EXPECTS:
             * - No arguments required.
             * 
             * GUARANTEES:
             * - Accumulates string key lengths and performs standard size estimates for values.
             * - Returns total estimated byte size.
             * 
             * DOES NOT PROMISE:
             * - Accurate calculation for nested structures, deep arrays, or complex types.
             * 
             * @returns {number} Estimated bytes.
             */
            getMemoryFootprint: () => {
                const cacheMeta = CacheManager.#caches.get(name)
                if (!cacheMeta) return 0
                let total = 0
                for (const [key, entry] of cacheMeta.cache) {
                    total += key.length * 2
                    if (entry.value !== undefined && entry.value !== null) {
                        if (typeof entry.value === 'string') {
                            total += entry.value.length * 2;
                        } else if (typeof entry.value === 'number' || typeof entry.value === 'boolean') {
                            total += 8;
                        } else {
                            total += 128; // basic object estimate without heavy traversal
                        }
                    }
                }
                return total
            }
        }
    }
    
    // ----------------------------------------------------------------------------
    // | method: #cleanupCache                                                    |
    // | internal helper to sweep a specific cache for expired data.              |
    // | also forces the cache down to 80% size if it's over the limit.           |
    // ----------------------------------------------------------------------------
    /**
     * Sweeps a cache map for expired entries and enforces capacity limits.
     * 
     * EXPECTS:
     * - cache: Map representing cache storage.
     * - accessOrder: Map tracking access times.
     * - ttl: Number millisecond lifetime.
     * - maxSize: Number maximum capacity.
     * 
     * GUARANTEES:
     * - Deletes any expired key whose timestamp exceeds TTL.
     * - Evicts LRU entries down to 80% of maxSize if size remains above maxSize.
     * - Returns total number of evicted entries.
     * 
     * DOES NOT PROMISE:
     * - Immediate collection of swept memory by the JS engine.
     * 
     * @param {Map} cache Cache storage.
     * @param {Map} accessOrder Access order.
     * @param {number} ttl TTL duration.
     * @param {number} maxSize Maximum size limit.
     * @returns {number} Number of evicted entries.
     */
    static #cleanupCache(cache, accessOrder, ttl, maxSize) {
        const now = Date.now()
        let cleanedCount = 0
        
        // delete anything that passed its expiration date.
        for (const [key, entry] of cache) {
            if (now - entry.timestamp > ttl) {
                cache.delete(key)
                accessOrder.delete(key)
                cleanedCount++
            }
        }
        
        // if we're still over the limit, kick out the oldest stuff.
        if (cache.size > maxSize) {
            // target 80% capacity to avoid immediate re-cleanup.
            const toRemove = cache.size - Math.floor(maxSize * 0.8)
            cleanedCount += CacheManager.#evictLRU(cache, accessOrder, toRemove)
        }
        
        return cleanedCount
    }
    
    // ----------------------------------------------------------------------------
    // | method: #evictLRU                                                        |
    // | internal helper to kick out the 'count' oldest items.                    |
    // ----------------------------------------------------------------------------
    /**
     * Evicts the specified number of least recently used entries.
     * Implements true O(1) eviction via Map key insertion order traversal.
     * 
     * EXPECTS:
     * - cache: Map representing cache storage.
     * - accessOrder: Map tracking access times.
     * - count: Number of items to evict.
     * 
     * GUARANTEES:
     * - Wipes oldest items from cache and access tracker.
     * - Returns actual number of deleted items.
     * - Runs in O(1) time complexity per evicted item.
     * 
     * DOES NOT PROMISE:
     * - Specific ordering when multiple items share the exact same access timestamp.
     * 
     * @param {Map} cache Cache storage.
     * @param {Map} accessOrder Access order.
     * @param {number} count Eviction count.
     * @returns {number} Number of evicted entries.
     */
    static #evictLRU(cache, accessOrder, count) {
        if (count <= 0) return 0
        
        let evictedCount = 0
        const keysIterator = accessOrder.keys()
        
        // Loop grabs keys from the front of the map (oldest insertion) in true O(1) time complexity
        while (evictedCount < count) {
            const nextEntry = keysIterator.next()
            if (nextEntry.done) break
            
            const oldestKey = nextEntry.value
            cache.delete(oldestKey)
            accessOrder.delete(oldestKey)
            evictedCount++
        }
        
        return evictedCount
    }
    
    // ----------------------------------------------------------------------------
    // | method: #estimateMemoryUsage                                             |
    // | rough guess of memory usage in bytes.                                    |
    // ----------------------------------------------------------------------------
    /**
     * Roughly estimates memory usage for a cache.
     * 
     * EXPECTS:
     * - cache: Map representing cache storage.
     * 
     * GUARANTEES:
     * - Multiplies cache size by 128 bytes.
     * - Returns estimated byte size.
     * 
     * DOES NOT PROMISE:
     * - Accurate memory accounting for actual stored value types.
     * 
     * @param {Map} cache Cache storage.
     * @returns {number} Estimated bytes.
     */
    static #estimateMemoryUsage(cache) {
        // assume ~128 bytes per entry on average. probably wrong.
        return cache.size * 128 
    }
    
    // start the 5-minute global cleanup interval.
    /**
     * Initializes the background task to run global cache cleanups.
     * 
     * EXPECTS:
     * - No arguments required.
     * 
     * GUARANTEES:
     * - Starts a single recurring interval timer via system.runInterval if not running.
     * 
     * DOES NOT PROMISE:
     * - Exact execution alignment with server game tick updates.
     * 
     * @returns {void}
     */
    static #startGlobalCleanup() {
        if (CacheManager.#globalCleanupInterval) return
        
        CacheManager.#globalCleanupInterval = system.runInterval(() => {
            CacheManager.#globalCleanup()
        }, 6000) 
    }
    
    // loop through every cache and trigger a cleanup.
    /**
     * Performs a full cleanup across all registered cache instances.
     * 
     * EXPECTS:
     * - No arguments required.
     * 
     * GUARANTEES:
     * - Iterates over every registered cache and calls #cleanupCache.
     * - Logs the total count of evicted entries if greater than zero.
     * 
     * DOES NOT PROMISE:
     * - Thread-safety during iteration if cache sizes are dynamically changing.
     * 
     * @returns {void}
     */
    static #globalCleanup() {
        let totalCleanedCount = 0
        
        for (const [_name, cacheMeta] of CacheManager.#caches) {
            const cleaned = CacheManager.#cleanupCache(
                cacheMeta.cache, 
                cacheMeta.accessOrder, 
                cacheMeta.options.ttl, 
                cacheMeta.options.maxSize
            )
            
            if (cleaned > 0) {
                cacheMeta.stats.cleanups++
                totalCleanedCount += cleaned
                cacheMeta.stats.deletes += cleaned
            }
        }
        
        if (totalCleanedCount > 0) {
            console.log(`[CacheManager] Global cleanup: removed ${totalCleanedCount} entries.`);
        }
    }
    
    // get stats for all caches combined.
    /**
     * Retrieves aggregated metrics across all active cache buffers.
     * 
     * EXPECTS:
     * - No arguments required.
     * 
     * GUARANTEES:
     * - Computes total sizes, memory footprints, and averages hit rate.
     * - Returns a combined stats payload.
     * 
     * DOES NOT PROMISE:
     * - A static snapshot if caches are mutated during computation.
     * 
     * @returns {Object} Global stats report.
     */
    static getGlobalStats() {
        const stats = {
            totalCaches: CacheManager.#caches.size,
            totalEntries: 0,
            totalMemoryUsage: 0,
            averageHitRate: 0,
            caches: {}
        }
        
        let totalHitRate = 0
        let cacheCount = 0
        
        for (const [name, cacheMeta] of CacheManager.#caches) {
            const cacheStats = {
                size: cacheMeta.cache.size,
                maxSize: cacheMeta.options.maxSize,
                hits: cacheMeta.stats.hits,
                misses: cacheMeta.stats.misses,
                hitRate: 0,
                memoryUsage: CacheManager.#estimateMemoryUsage(cacheMeta.cache)
            }
            
            const totalRequests = cacheStats.hits + cacheStats.misses
            if (totalRequests > 0) {
                cacheStats.hitRate = Math.round((cacheStats.hits / totalRequests) * 100)
                totalHitRate += cacheStats.hitRate
                cacheCount++
            }
            
            stats.caches[name] = cacheStats
            stats.totalEntries += cacheStats.size
            stats.totalMemoryUsage += cacheStats.memoryUsage
        }
        
        if (cacheCount > 0) {
            stats.averageHitRate = Math.round(totalHitRate / cacheCount)
        }
        
        return stats
    }
    
    // delete a specific cache instance.
    /**
     * Clears and destroys a registered cache instance by name.
     * 
     * EXPECTS:
     * - name: String identifier of the cache.
     * 
     * GUARANTEES:
     * - Clears the underlying cache maps and metadata.
     * - Unregisters the cleanup runInterval via system.clearRun.
     * - Returns true if the cache existed and was destroyed, false otherwise.
     * - Safely cancels the global cleanup interval if no caches remain registered.
     * 
     * DOES NOT PROMISE:
     * - Garbage collection of cache values if external references to them exist.
     * 
     * @param {string} name Cache name.
     * @returns {boolean} True if destroyed, false otherwise.
     */
    static destroyCache(name) {
        const cacheMeta = CacheManager.#caches.get(name)
        if (!cacheMeta) return false
        
        system.clearRun(cacheMeta.cleanup)
        cacheMeta.cache.clear()
        cacheMeta.accessOrder.clear()
        CacheManager.#caches.delete(name)
        
        // Defuse background cleanup leak if all cache registries are destroyed
        if (CacheManager.#caches.size === 0 && CacheManager.#globalCleanupInterval) {
            system.clearRun(CacheManager.#globalCleanupInterval)
            CacheManager.#globalCleanupInterval = null
        }
        
        return true
    }
    
    // wipe everything from the registry.
    /**
     * Wipes and unregisters all active cache buffers.
     * 
     * EXPECTS:
     * - No arguments required.
     * 
     * GUARANTEES:
     * - Wipes and clears all underlying maps in the registry.
     * - Unregisters all scheduled intervals.
     * - Clears the global cleanup timer and the caches map.
     * 
     * DOES NOT PROMISE:
     * - Immediate release of held heap space.
     * 
     * @returns {void}
     */
    static destroyAll() {
        for (const [_name, cacheMeta] of CacheManager.#caches) {
            system.clearRun(cacheMeta.cleanup)
            cacheMeta.cache.clear()
            cacheMeta.accessOrder.clear()
        }
        
        if (CacheManager.#globalCleanupInterval) {
            system.clearRun(CacheManager.#globalCleanupInterval)
            CacheManager.#globalCleanupInterval = null
        }
        
        CacheManager.#caches.clear()
    }
    
    // get names of all active caches.
    /**
     * Lists the names of all registered caches.
     * 
     * EXPECTS:
     * - No arguments required.
     * 
     * GUARANTEES:
     * - Returns an array of strings representing cache names.
     * 
     * DOES NOT PROMISE:
     * - Alphabetical or insert-ordered sequence.
     * 
     * @returns {string[]} Cache name list.
     */
    static getCacheNames() {
        return Array.from(CacheManager.#caches.keys())
    }
    
    // check if a cache exists.
    /**
     * Checks whether a cache exists in the global registry.
     * 
     * EXPECTS:
     * - name: String key of cache.
     * 
     * GUARANTEES:
     * - Returns true if a cache with the specified name is registered, false otherwise.
     * 
     * DOES NOT PROMISE:
     * - Checks whether the cache has any active entries.
     * 
     * @param {string} name Cache name.
     * @returns {boolean} Presence flag.
     */
    static hasCache(name) {
        return CacheManager.#caches.has(name)
    }
}

// ----------------------------------------------------------------------------
// | default caches                                                           |
// | pre-configured buffers for core systems.                                  |
// ----------------------------------------------------------------------------

// small cache for player metadata.
export const PlayerCache = CacheManager.createCache("players", { 
    ttl: 5000, 
    maxSize: 500, 
    cleanupInterval: 30000 
})

// cache for shop prices.
export const ShopCache = CacheManager.createCache("shop", { 
    ttl: 30000, 
    maxSize: 50, 
    cleanupInterval: 60000 
})

// cache for rank metadata.
export const RankCache = CacheManager.createCache("ranks", { 
    ttl: 60000, 
    maxSize: 10, 
    cleanupInterval: 120000 
})

// large cache for permission nodes.
export const PermissionCache = CacheManager.createCache("permissions", { 
    ttl: 5000, 
    maxSize: 1000, 
    cleanupInterval: 30000 
})

// large cache for /reply command targets.
export const ReplyCache = CacheManager.createCache("replies", {
    ttl: 300000, // 5m TTL
    maxSize: 2000,
    cleanupInterval: 60000
})
