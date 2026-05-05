/*
 * CACHE_ORCHESTRATOR_V1
 * ----------------------------------------------------------------------------
 * Centralized memory buffering system. Implements TTL (Time-To-Live) and 
 * LRU (Least-Recently-Used) eviction strategies to prevent heap exhaustion. 
 *
 * PHILOSOPHY: Database IO is expensive. In-memory Map lookups are cheap. 
 * This module ensures that hot-data stays in the buffer while cold-data 
 * is aggressively purged to maintain O(1) access time.
 */

export class CacheManager {
    static #caches = new Map()
    static #globalCleanupInterval = null
    
    /*
     * CACHE_INSTANCE_FACTORY
     * ----------------------------------------------------------------------------
     * Spawns a new isolated cache buffer with dedicated TTL and size limits. 
     * Includes an internal interval worker for targeted memory cleanup.
     *
     * @param {string} name - The unique buffer identifier.
     * @param {Object} options - TTL, maxSize, and cleanupInterval parameters.
     */
    static createCache(name, options = {}) {
        const cache = new Map()
        const accessOrder = new Map() // LRU_ACCESS_STAMP_MAP
        const ttl = options.ttl || 5000 // 5s baseline
        const maxSize = options.maxSize || 1000
        const cleanupInterval = options.cleanupInterval || 60000 // 1m baseline
        
        /* 
         * INTERNAL_CLEANUP_WORKER
         * Periodically triggers the #cleanupCache routine to purge expired 
         * entries and enforce LRU limits.
         */
        const cleanup = setInterval(() => {
            this.#cleanupCache(cache, accessOrder, ttl, maxSize)
        }, cleanupInterval)
        
        this.#caches.set(name, { 
            cache, 
            accessOrder, 
            cleanup, 
            options: { ttl, maxSize, cleanupInterval },
            stats: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                cleanups: 0
            }
        })
        
        this.#startGlobalCleanup()
        
        return {
            /* 
             * BUFFER_QUERY_VECTOR
             * Fetches an entry from the map. Updates the access-stamp for 
             * LRU tracking. If the entry is expired, it's purged instantly 
             * to prevent zombie-data leakage.
             */
            get: (key) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return null
                
                const entry = cacheMeta.cache.get(key)
                if (entry && Date.now() - entry.timestamp <= ttl) {
                    cacheMeta.accessOrder.set(key, Date.now())
                    cacheMeta.stats.hits++
                    return entry.value
                }
                
                if (entry) {
                    cacheMeta.cache.delete(key)
                    cacheMeta.accessOrder.delete(key)
                }
                
                cacheMeta.stats.misses++
                return null
            },
            
            /* 
             * BUFFER_INJECTION_VECTOR
             * Commits a value to the map. Triggers #evictLRU if the 
             * maxSize limit is reached.
             */
            set: (key, value) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return
                
                if (cacheMeta.cache.size >= maxSize && !cacheMeta.cache.has(key)) {
                    this.#evictLRU(cacheMeta.cache, cacheMeta.accessOrder, 1)
                }
                
                cacheMeta.cache.set(key, { 
                    value, 
                    timestamp: Date.now() 
                })
                cacheMeta.accessOrder.set(key, Date.now())
                cacheMeta.stats.sets++
            },
            
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
            
            clear: () => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return
                
                cacheMeta.cache.clear()
                cacheMeta.accessOrder.clear()
            },
            
            /* 
             * REGEX_INVALIDATION_VECTOR
             * Bulk-purges entries whose keys match the provided pattern. 
             * Useful for clearing related sub-keys (e.g., 'player_stats_*').
             */
            invalidate: (pattern) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return 0
                
                const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)
                let deleted = 0
                
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
                    memoryUsage: this.#estimateMemoryUsage(cacheMeta.cache)
                }
            },
            
            has: (key) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return false
                
                const entry = cacheMeta.cache.get(key)
                return !!(entry && Date.now() - entry.timestamp <= ttl)
            },
            
            keys: () => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return []
                
                return Array.from(cacheMeta.cache.keys())
            },
            
            size: () => {
                const cacheMeta = this.#caches.get(name)
                return cacheMeta ? cacheMeta.cache.size : 0
            }
        }
    }
    
    /*
     * CACHE_SANITIZATION_PROTOCOL
     * ----------------------------------------------------------------------------
     * Aggressively sweeps the map for expired entries. If the map is still 
     * over capacity, it triggers an LRU eviction to reach 80% capacity.
     */
    static #cleanupCache(cache, accessOrder, ttl, maxSize) {
        const now = Date.now()
        let cleaned = 0
        
        for (const [key, entry] of cache) {
            if (now - entry.timestamp > ttl) {
                cache.delete(key)
                accessOrder.delete(key)
                cleaned++
            }
        }
        
        if (cache.size > maxSize) {
            const toRemove = cache.size - Math.floor(maxSize * 0.8)
            cleaned += this.#evictLRU(cache, accessOrder, toRemove)
        }
        
        return cleaned
    }
    
    /*
     * LRU_EVICTION_VECTOR
     * ----------------------------------------------------------------------------
     * Identifies the oldest accessed entries and terminates them to 
     * free up heap space.
     */
    static #evictLRU(cache, accessOrder, count) {
        const entries = Array.from(accessOrder.entries())
            .sort((a, b) => a[1] - b[1]) // STAMP_COMPARISON
            .slice(0, count)
        
        entries.forEach(([key]) => {
            cache.delete(key)
            accessOrder.delete(key)
        })
        
        return entries.length
    }
    
    /*
     * HEAP_USAGE_ESTIMATOR
     * ----------------------------------------------------------------------------
     * Calculates the approximate byte-count of the cached data. 
     * Essential for monitoring for database-bloat or memory-leaks.
     */
    static #estimateMemoryUsage(cache) {
        let size = 0
        for (const [key, entry] of cache) {
            size += JSON.stringify(key).length * 2 
            size += JSON.stringify(entry.value).length * 2
            size += 64 // STACK_OVERHEAD_ESTIMATE
        }
        return size
    }
    
    static #startGlobalCleanup() {
        if (this.#globalCleanupInterval) return
        
        this.#globalCleanupInterval = setInterval(() => {
            this.#globalCleanup()
        }, 300000) // 5m Interval
    }
    
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
            console.log(`[CacheManager] GLOBAL_PURGE: Removed ${totalCleaned} zombie entries.`);
        }
    }
    
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
    
    static destroyCache(name) {
        const cacheMeta = this.#caches.get(name)
        if (!cacheMeta) return false
        
        clearInterval(cacheMeta.cleanup)
        cacheMeta.cache.clear()
        cacheMeta.accessOrder.clear()
        this.#caches.delete(name)
        
        return true
    }
    
    static destroyAll() {
        for (const [_name, cacheMeta] of this.#caches) {
            clearInterval(cacheMeta.cleanup)
            cacheMeta.cache.clear()
            cacheMeta.accessOrder.clear()
        }
        
        if (this.#globalCleanupInterval) {
            clearInterval(this.#globalCleanupInterval)
            this.#globalCleanupInterval = null
        }
        
        this.#caches.clear()
    }
    
    static getCacheNames() {
        return Array.from(this.#caches.keys())
    }
    
    static hasCache(name) {
        return this.#caches.has(name)
    }
}

/* 
 * INDUSTRIAL_CACHE_DOCKING
 * ----------------------------------------------------------------------------
 * Pre-configured buffers for high-frequency sub-systems. 
 * Optimized for specific TTL and size requirements.
 */
export const PlayerCache = CacheManager.createCache("players", { 
    ttl: 5000, 
    maxSize: 500, 
    cleanupInterval: 30000 
})

export const ShopCache = CacheManager.createCache("shop", { 
    ttl: 30000, 
    maxSize: 50, 
    cleanupInterval: 60000 
})

export const RankCache = CacheManager.createCache("ranks", { 
    ttl: 60000, 
    maxSize: 10, 
    cleanupInterval: 120000 
})

export const PermissionCache = CacheManager.createCache("permissions", { 
    ttl: 5000, 
    maxSize: 1000, 
    cleanupInterval: 30000 
})
