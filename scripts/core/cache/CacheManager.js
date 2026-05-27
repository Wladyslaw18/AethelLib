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
    static createCache(name, options = {}) {
        // the actual storage map.
        const cache = new Map()
        // tracks when each key was last used for the LRU eviction policy.
        const accessOrder = new Map() 
        // how long data stays valid (default 5 seconds).
        const ttl = options.ttl || 5000 
        // maximum number of items allowed in the map.
        const maxSize = options.maxSize || 1000
        // how often the background cleanup runs (default 1 minute).
        const cleanupInterval = options.cleanupInterval || 60000 
        
        // ----------------------------------------------------------------------------
        // | background cleanup                                                       |
        // | periodically clears out expired stuff and enforces size limits.           |
        // ----------------------------------------------------------------------------
        const cleanup = system.runInterval(() => {
            // call the internal cleanup helper.
            this.#cleanupCache(cache, accessOrder, ttl, maxSize)
        }, Math.floor(cleanupInterval / 50))
        
        // save the metadata in our global registry.
        this.#caches.set(name, { 
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
        this.#startGlobalCleanup()
        
        // return the public interface for this cache.
        return {
            // ----------------------------------------------------------------------------
            // | get                                                                      |
            // | fetch a value. updates LRU stamp. deletes if expired.                    |
            // ----------------------------------------------------------------------------
            get: (key) => {
                // get the metadata for this cache.
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return null
                
                // try to find the entry.
                const entry = cacheMeta.cache.get(key)
                // check if it exists and hasn't expired yet.
                if (entry && Date.now() - entry.timestamp <= ttl) {
                    // update the access time so it doesn't get evicted by LRU.
                    cacheMeta.accessOrder.set(key, Date.now())
                    // increment hit counter.
                    cacheMeta.stats.hits++
                    return entry.value
                }
                
                // if it exists but is expired, nuke it now.
                if (entry) {
                    cacheMeta.cache.delete(key)
                    cacheMeta.accessOrder.delete(key)
                }
                
                // increment miss counter.
                cacheMeta.stats.misses++
                return null
            },
            
            // ----------------------------------------------------------------------------
            // | set                                                                      |
            // | adds a value. kicks out the oldest item if the cache is full.            |
            // ----------------------------------------------------------------------------
            set: (key, value) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return
                
                // check if we're at the limit and adding a NEW key.
                if (cacheMeta.cache.size >= maxSize && !cacheMeta.cache.has(key)) {
                    // kick out the least recently used item.
                    this.#evictLRU(cacheMeta.cache, cacheMeta.accessOrder, 1)
                }
                
                // save the value with the current timestamp.
                cacheMeta.cache.set(key, { 
                    value, 
                    timestamp: Date.now() 
                })
                // update the access order.
                cacheMeta.accessOrder.set(key, Date.now())
                // increment set counter.
                cacheMeta.stats.sets++
            },
            
            // remove a specific key.
            delete: (key) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return false
                
                const deleted = cacheMeta.cache.delete(key)
                cacheMeta.accessOrder.delete(key)
                
                if (deleted) {
                    cacheMeta.stats.deletes++
                }
                
                return deleted
            },
            
            // wipe everything.
            clear: () => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return
                
                cacheMeta.cache.clear()
                cacheMeta.accessOrder.clear()
            },
            
            // ----------------------------------------------------------------------------
            // | invalidate                                                               |
            // | clear all keys that match a specific regex pattern.                      |
            // ----------------------------------------------------------------------------
            invalidate: (pattern) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return 0
                
                // convert string to regex if needed.
                const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)
                let deleted = 0
                
                // loop through every key. slow but effective.
                for (const [key] of cacheMeta.cache) {
                    if (regex.test(key)) {
                        cacheMeta.cache.delete(key)
                        cacheMeta.accessOrder.delete(key)
                        deleted++
                    }
                }
                
                cacheMeta.stats.deletes += deleted
                return deleted
            },
            
            // get performance metrics.
            getStats: () => {
                const cacheMeta = this.#caches.get(name)
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
                    memoryUsage: this.#estimateMemoryUsage(cacheMeta.cache)
                }
            },
            
            // check if a key exists and is valid.
            has: (key) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return false
                
                const entry = cacheMeta.cache.get(key)
                return !!(entry && Date.now() - entry.timestamp <= ttl)
            },
            
            // get list of all keys.
            keys: () => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return []
                
                return Array.from(cacheMeta.cache.keys())
            },
            
            // current size.
            size: () => {
                const cacheMeta = this.#caches.get(name)
                return cacheMeta ? cacheMeta.cache.size : 0
            },
            
            // get memory footprint in bytes.
            getMemoryFootprint: () => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return 0
                let total = 0
                for (const [key, entry] of cacheMeta.cache) {
                    total += key.length * 2
                    if (entry.value !== undefined && entry.value !== null) {
                        try {
                            total += JSON.stringify(entry.value).length * 2
                        } catch {}
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
    static #cleanupCache(cache, accessOrder, ttl, maxSize) {
        const now = Date.now()
        let cleaned = 0
        
        // delete anything that passed its expiration date.
        for (const [key, entry] of cache) {
            if (now - entry.timestamp > ttl) {
                cache.delete(key)
                accessOrder.delete(key)
                cleaned++
            }
        }
        
        // if we're still over the limit, kick out the oldest stuff.
        if (cache.size > maxSize) {
            // target 80% capacity to avoid immediate re-cleanup.
            const toRemove = cache.size - Math.floor(maxSize * 0.8)
            cleaned += this.#evictLRU(cache, accessOrder, toRemove)
        }
        
        return cleaned
    }
    
    // ----------------------------------------------------------------------------
    // | method: #evictLRU                                                        |
    // | internal helper to kick out the 'count' oldest items.                    |
    // ----------------------------------------------------------------------------
    static #evictLRU(cache, accessOrder, count) {
        // sort by access timestamp (ascending).
        const entries = Array.from(accessOrder.entries())
            .sort((a, b) => a[1] - b[1]) 
            .slice(0, count)
        
        // delete the losers.
        entries.forEach(([key]) => {
            cache.delete(key)
            accessOrder.delete(key)
        })
        
        return entries.length
    }
    
    // ----------------------------------------------------------------------------
    // | method: #estimateMemoryUsage                                             |
    // | rough guess of memory usage in bytes.                                    |
    // ----------------------------------------------------------------------------
    static #estimateMemoryUsage(cache) {
        // assume ~128 bytes per entry on average. probably wrong.
        return cache.size * 128 
    }
    
    // start the 5-minute global cleanup interval.
    static #startGlobalCleanup() {
        if (this.#globalCleanupInterval) return
        
        this.#globalCleanupInterval = system.runInterval(() => {
            this.#globalCleanup()
        }, 6000) 
    }
    
    // loop through every cache and trigger a cleanup.
    static #globalCleanup() {
        let totalCleaned = 0
        
        for (const [_name, cacheMeta] of this.#caches) {
            const cleaned = this.#cleanupCache(
                cacheMeta.cache, 
                cacheMeta.accessOrder, 
                cacheMeta.options.ttl, 
                cacheMeta.options.maxSize
            )
            
            if (cleaned > 0) {
                cacheMeta.stats.cleanups++
                totalCleaned += cleaned
            }
        }
        
        if (totalCleaned > 0) {
            console.log(`[CacheManager] Global cleanup: removed ${totalCleaned} entries.`);
        }
    }
    
    // get stats for all caches combined.
    static getGlobalStats() {
        const stats = {
            totalCaches: this.#caches.size,
            totalEntries: 0,
            totalMemoryUsage: 0,
            averageHitRate: 0,
            caches: {}
        }
        
        let totalHitRate = 0
        let cacheCount = 0
        
        for (const [name, cacheMeta] of this.#caches) {
            const cacheStats = {
                size: cacheMeta.cache.size,
                maxSize: cacheMeta.options.maxSize,
                hits: cacheMeta.stats.hits,
                misses: cacheMeta.stats.misses,
                hitRate: 0,
                memoryUsage: this.#estimateMemoryUsage(cacheMeta.cache)
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
    static destroyCache(name) {
        const cacheMeta = this.#caches.get(name)
        if (!cacheMeta) return false
        
        system.clearRun(cacheMeta.cleanup)
        cacheMeta.cache.clear()
        cacheMeta.accessOrder.clear()
        this.#caches.delete(name)
        
        return true
    }
    
    // wipe everything from the registry.
    static destroyAll() {
        for (const [_name, cacheMeta] of this.#caches) {
            system.clearRun(cacheMeta.cleanup)
            cacheMeta.cache.clear()
            cacheMeta.accessOrder.clear()
        }
        
        if (this.#globalCleanupInterval) {
            system.clearRun(this.#globalCleanupInterval)
            this.#globalCleanupInterval = null
        }
        
        this.#caches.clear()
    }
    
    // get names of all active caches.
    static getCacheNames() {
        return Array.from(this.#caches.keys())
    }
    
    // check if a cache exists.
    static hasCache(name) {
        return this.#caches.has(name)
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
