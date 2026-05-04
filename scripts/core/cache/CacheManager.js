/**
 * Cache Manager - Centralized Caching System with TTL and LRU Support
 * Provides high-performance caching with automatic cleanup and memory management
 */

import { system } from "@minecraft/server"

export class CacheManager {
    static #caches = new Map()
    static #globalCleanupInterval = null
    
    /**
     * Create a new cache with specified options
     * @param {string} name - Cache name
     * @param {Object} options - Cache configuration
     * @returns {Object} Cache interface
     */
    static createCache(name, options = {}) {
        const cache = new Map()
        const accessOrder = new Map() // For LRU tracking
        const ttl = options.ttl || 5000 // 5 seconds default
        const maxSize = options.maxSize || 1000
        const cleanupInterval = options.cleanupInterval || 60000 // 1 minute
        
        // Start cleanup interval for this cache
        const cleanup = setInterval(() => {
            this.#cleanupCache(cache, accessOrder, ttl, maxSize)
        }, cleanupInterval)
        
        // Store cache metadata
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
        
        // Start global cleanup if not already running
        this.#startGlobalCleanup()
        
        return {
            /**
             * Get value from cache
             * @param {string} key - Cache key
             * @returns {any} Cached value or null
             */
            get: (key) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return null
                
                const entry = cacheMeta.cache.get(key)
                if (entry && Date.now() - entry.timestamp <= ttl) {
                    // Update access order for LRU
                    cacheMeta.accessOrder.set(key, Date.now())
                    cacheMeta.stats.hits++
                    return entry.value
                }
                
                // Remove expired entry
                if (entry) {
                    cacheMeta.cache.delete(key)
                    cacheMeta.accessOrder.delete(key)
                }
                
                cacheMeta.stats.misses++
                return null
            },
            
            /**
             * Set value in cache
             * @param {string} key - Cache key
             * @param {any} value - Value to cache
             */
            set: (key, value) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return
                
                // Check size limit and remove oldest if needed
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
            
            /**
             * Delete value from cache
             * @param {string} key - Cache key
             * @returns {boolean} Whether key was deleted
             */
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
            
            /**
             * Clear all entries in cache
             */
            clear: () => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return
                
                cacheMeta.cache.clear()
                cacheMeta.accessOrder.clear()
            },
            
            /**
             * Invalidate entries matching pattern
             * @param {RegExp|string} pattern - Pattern to match keys
             */
            invalidate: (pattern) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return
                
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
            
            /**
             * Get cache statistics
             * @returns {Object} Cache statistics
             */
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
            
            /**
             * Check if cache has key
             * @param {string} key - Cache key
             * @returns {boolean} Whether key exists
             */
            has: (key) => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return false
                
                const entry = cacheMeta.cache.get(key)
                return entry && Date.now() - entry.timestamp <= ttl
            },
            
            /**
             * Get all keys in cache
             * @returns {Array} Array of keys
             */
            keys: () => {
                const cacheMeta = this.#caches.get(name)
                if (!cacheMeta) return []
                
                return Array.from(cacheMeta.cache.keys())
            },
            
            /**
             * Get cache size
             * @returns {number} Number of entries
             */
            size: () => {
                const cacheMeta = this.#caches.get(name)
                return cacheMeta ? cacheMeta.cache.size : 0
            }
        }
    }
    
    /**
     * Cleanup expired entries and enforce size limits
     * @param {Map} cache - Cache map
     * @param {Map} accessOrder - Access order map
     * @param {number} ttl - Time to live
     * @param {number} maxSize - Maximum size
     */
    static #cleanupCache(cache, accessOrder, ttl, maxSize) {
        const now = Date.now()
        let cleaned = 0
        
        // Remove expired entries
        for (const [key, entry] of cache) {
            if (now - entry.timestamp > ttl) {
                cache.delete(key)
                accessOrder.delete(key)
                cleaned++
            }
        }
        
        // Remove oldest entries if over size limit
        if (cache.size > maxSize) {
            const toRemove = cache.size - Math.floor(maxSize * 0.8) // Remove to 80% capacity
            cleaned += this.#evictLRU(cache, accessOrder, toRemove)
        }
        
        return cleaned
    }
    
    /**
     * Evict least recently used entries
     * @param {Map} cache - Cache map
     * @param {Map} accessOrder - Access order map
     * @param {number} count - Number of entries to evict
     * @returns {number} Number of entries evicted
     */
    static #evictLRU(cache, accessOrder, count) {
        const entries = Array.from(accessOrder.entries())
            .sort((a, b) => a[1] - b[1]) // Sort /* NEXUS */ time (oldest first)
            .slice(0, count)
        
        entries.forEach(([key]) => {
            cache.delete(key)
            accessOrder.delete(key)
        })
        
        return entries.length
    }
    
    /**
     * Estimate memory usage of cache
     * @param {Map} cache - Cache map
     * @returns {number} Estimated memory usage in bytes
     */
    static #estimateMemoryUsage(cache) {
        let size = 0
        for (const [key, entry] of cache) {
            // Rough estimation: key + value + overhead
            size += JSON.stringify(key).length * 2 // UTF-16
            size += JSON.stringify(entry.value).length * 2
            size += 64 // Entry overhead
        }
        return size
    }
    
    /**
     * Start global cleanup interval
     */
    static #startGlobalCleanup() {
        if (this.#globalCleanupInterval) return
        
        this.#globalCleanupInterval = setInterval(() => {
            this.#globalCleanup()
        }, 300000) // Every 5 minutes
    }
    
    /**
     * Global cleanup of all caches
     */
    static #globalCleanup() {
        let totalCleaned = 0
        
        for (const [name, cacheMeta] of this.#caches) {
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
            console.log(`CacheManager: Global cleanup removed ${totalCleaned} expired entries`)
        }
    }
    
    /**
     * Get statistics for all caches
     * @returns {Object} Global statistics
     */
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
    
    /**
     * Destroy a specific cache
     * @param {string} name - Cache name
     */
    static destroyCache(name) {
        const cacheMeta = this.#caches.get(name)
        if (!cacheMeta) return false
        
        clearInterval(cacheMeta.cleanup)
        cacheMeta.cache.clear()
        cacheMeta.accessOrder.clear()
        this.#caches.delete(name)
        
        return true
    }
    
    /**
     * Destroy all caches
     */
    static destroyAll() {
        for (const [name, cacheMeta] of this.#caches) {
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
    
    /**
     * Get cache names
     * @returns {Array} Array of cache names
     */
    static getCacheNames() {
        return Array.from(this.#caches.keys())
    }
    
    /**
     * Check if cache exists
     * @param {string} name - Cache name
     * @returns {boolean} Whether cache exists
     */
    static hasCache(name) {
        return this.#caches.has(name)
    }
}

// Pre-configured cache instances for common use cases
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

