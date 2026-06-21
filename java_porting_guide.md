# Aegis Java Architecture & Porting Guide
## High-Performance Plumbing Patterns for Java / Paper / Spigot Plugins

This guide details three key architectural plumbing systems from AethelLib, translated into thread-safe, production-ready Java structures. These patterns will help you decouple your modules, manage tick budgets, and optimize database read caching in Spigot/Paper/Velocity environments.

---

## 1. Decoupled Pub-Sub Event Bus (`SignalBus`)

**The Java Problem:** In standard Bukkit, communicating between two modules (e.g., triggering a chat badge change when a player unlocks a rank) requires writing full `Event` and `Listener` classes and registering them via `Bukkit.getPluginManager().registerEvents()`. This forces tight compile-time coupling.

**The Solution:** A thread-safe, lightweight memory-based `SignalBus`. Modules communicate by emitting signals with dynamic arrays of arguments without knowing about each other's classes or types.

### Java Implementation

```java
package com.aethelgrad.core.signalbus;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;
import java.util.logging.Level;
import java.util.logging.Logger;

public class SignalBus {
    private static final Map<String, List<Consumer<Object[]>>> listeners = new ConcurrentHashMap<>();
    private static final Logger LOGGER = Logger.getLogger("SignalBus");

    /**
     * Subscribe to a signal. Returns a Runnable to easily unsubscribe.
     */
    public static Runnable on(String event, Consumer<Object[]> callback) {
        listeners.computeIfAbsent(event, k -> new CopyOnWriteArrayList<>()).add(callback);
        return () -> off(event, callback);
    }

    /**
     * Unsubscribe from a signal.
     */
    public static boolean off(String event, Consumer<Object[]> callback) {
        List<Consumer<Object[]>> eventListeners = listeners.get(event);
        if (eventListeners == null) return false;
        return eventListeners.remove(callback);
    }

    /**
     * Emit a signal to all registered subscribers. Handles exceptions safely.
     */
    public static void emit(String event, Object... args) {
        List<Consumer<Object[]>> eventListeners = listeners.get(event);
        if (eventListeners == null || eventListeners.isEmpty()) return;

        for (Consumer<Object[]> listener : eventListeners) {
            try {
                listener.accept(args);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, "Exception occurred during emit of signal: " + event, e);
            }
        }
    }

    /**
     * Subscribe to a signal for exactly one execution.
     */
    public static void once(String event, Consumer<Object[]> callback) {
        new Consumer<Object[]>() {
            private Runnable unsubscribe;

            @Override
            public void accept(Object[] args) {
                if (unsubscribe != null) {
                    unsubscribe.run();
                } else {
                    off(event, this);
                }
                callback.accept(args);
            }

            public void register(String evt) {
                this.unsubscribe = on(evt, this);
            }
        }.register(event);
    }

    public static void clear(String event) {
        listeners.remove(event);
    }

    public static void clearAll() {
        listeners.clear();
    }
}
```

---

## 2. Telemetry-Enabled Task Orchestrator (`TickScheduler`)

**The Java Problem:** Bukkit's scheduler (`BukkitScheduler`) runs tasks but provides no performance telemetry. If a background database save lags or an item-clear loop spikes, you won't know which task caused the MSPT spike. It also lacks conditional execution checks and built-in exception backoffs.

**The Solution:** A `TickScheduler` wrapper that hooks Bukkit's scheduler, checks run conditions dynamically, limits execution rates (throttling), and logs rolling average execution times to a telemetry buffer.

### Java Implementation

```java
package com.aethelgrad.core.scheduler;

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BooleanSupplier;

public class TickScheduler {
    private static final Map<Integer, TaskMeta> tasks = new ConcurrentHashMap<>();
    private static final AtomicInteger taskIdGenerator = new AtomicInteger(0);
    private static JavaPlugin pluginInstance;

    public static void init(JavaPlugin plugin) {
        pluginInstance = plugin;
    }

    public static int schedule(Runnable callback, long intervalTicks, TaskOptions options) {
        if (pluginInstance == null) {
            throw new IllegalStateException("TickScheduler is not initialized with a JavaPlugin instance.");
        }

        int id = taskIdGenerator.incrementAndGet();
        TaskMeta meta = new TaskMeta(id, callback, intervalTicks, options);

        BukkitTask task = new BukkitRunnable() {
            private long lastRun = 0;

            @Override
            public void run() {
                if (!meta.running) {
                    this.cancel();
                    return;
                }

                // Check conditional gate
                if (options.condition != null && !options.condition.getAsBoolean()) {
                    return;
                }

                // Rate limiting (Throttling)
                if (options.maxPerSecond > 0) {
                    long now = System.currentTimeMillis();
                    if (now - lastRun < (1000 / options.maxPerSecond)) {
                        return;
                    }
                    lastRun = now;
                }

                long startTime = System.nanoTime();
                try {
                    callback.run();
                    long duration = System.nanoTime() - startTime;
                    meta.updateStats(duration, false);
                    meta.retries = 0;
                } catch (Exception e) {
                    long duration = System.nanoTime() - startTime;
                    meta.updateStats(duration, true);
                    meta.retries++;
                    pluginInstance.getLogger().severe("Task " + options.name + " (" + id + ") failed: " + e.getMessage());

                    if (meta.retries >= options.maxRetries) {
                        if (options.stopOnError) {
                            pluginInstance.getLogger().warning("Task " + options.name + " exceeded max retries. Cancelling.");
                            cancelTask(id);
                        }
                    }
                }
            }
        }.runTaskTimer(pluginInstance, 0, intervalTicks);

        meta.bukkitTask = task;
        tasks.put(id, meta);
        return id;
    }

    public static boolean cancelTask(int id) {
        TaskMeta meta = tasks.remove(id);
        if (meta == null) return false;
        meta.running = false;
        if (meta.bukkitTask != null) {
            meta.bukkitTask.cancel();
        }
        return true;
    }

    public static class TaskOptions {
        public String name = "Unnamed_Task";
        public BooleanSupplier condition = () -> true;
        public int maxPerSecond = -1;
        public boolean stopOnError = false;
        public int maxRetries = 3;
    }

    public static class TaskMeta {
        public final int id;
        public final Runnable callback;
        public final long intervalTicks;
        public final TaskOptions options;
        public BukkitTask bukkitTask;
        public volatile boolean running = true;
        public int retries = 0;

        // Telemetry stats
        public long executions = 0;
        public long errors = 0;
        public long totalDurationNanos = 0;
        public long lastDurationNanos = 0;

        public TaskMeta(int id, Runnable callback, long intervalTicks, TaskOptions options) {
            this.id = id;
            this.callback = callback;
            this.intervalTicks = intervalTicks;
            this.options = options;
        }

        public synchronized void updateStats(long durationNanos, boolean failed) {
            this.executions++;
            this.lastDurationNanos = durationNanos;
            this.totalDurationNanos += durationNanos;
            if (failed) this.errors++;
        }

        public synchronized double getAverageDurationMs() {
            if (executions == 0) return 0.0;
            return (double) totalDurationNanos / executions / 1_000_000.0;
        }
    }
}
```

---

## 3. Self-Evicting Cache Layer (`CacheManager`)

**The Java Problem:** Java database engines (SQL queries via HikariCP, Hibernate, etc.) must never block the main server thread. Direct calls to `/balance` or checking land claim ownership must retrieve values from memory. Standard HashMaps will leak memory if keys are not evicted, and Guava/Caffeine adds heavy library overhead.

**The Solution:** A lightweight, self-evicting `CacheManager` built on `LinkedHashMap` (which naturally supports Least Recently Used eviction via access-order) and a cleanup task to sweep expired data (Time-To-Live).

### Java Implementation

```java
package com.aethelgrad.core.cache;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Pattern;

public class CacheManager<K, V> {
    private final Map<K, CacheEntry<V>> cacheMap;
    private final long ttlMs;
    private final int maxSize;
    private final ReentrantLock lock = new ReentrantLock();

    // Stats
    private long hits = 0;
    private long misses = 0;

    public CacheManager(long ttlMs, int maxSize) {
        this.ttlMs = ttlMs;
        this.maxSize = maxSize;

        // Custom LinkedHashMap with access-order set to true for LRU eviction
        this.cacheMap = new LinkedHashMap<K, CacheEntry<V>>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, CacheEntry<V>> eldest) {
                return size() > maxSize;
            }
        };
    }

    public void put(K key, V value) {
        lock.lock();
        try {
            cacheMap.put(key, new CacheEntry<>(value, System.currentTimeMillis()));
        } finally {
            lock.unlock();
        }
    }

    public V get(K key) {
        lock.lock();
        try {
            CacheEntry<V> entry = cacheMap.get(key);
            if (entry == null) {
                misses++;
                return null;
            }

            // Verify TTL expiration
            if (System.currentTimeMillis() - entry.timestamp > ttlMs) {
                cacheMap.remove(key); // Evict expired
                misses++;
                return null;
            }

            hits++;
            return entry.value;
        } finally {
            lock.unlock();
        }
    }

    public boolean remove(K key) {
        lock.lock();
        try {
            return cacheMap.remove(key) != null;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Run a cleanup sweep to evict all expired entries.
     */
    public void sweepExpired() {
        lock.lock();
        try {
            long now = System.currentTimeMillis();
            cacheMap.entrySet().removeIf(entry -> now - entry.getValue().timestamp > ttlMs);
        } finally {
            lock.unlock();
        }
    }

    /**
     * Invalidate keys matching a string pattern (if keys are Strings).
     */
    public void invalidateRegex(String regex) {
        lock.lock();
        try {
            Pattern pattern = Pattern.compile(regex);
            cacheMap.keySet().removeIf(key -> {
                if (key instanceof String) {
                    return pattern.matcher((String) key).matches();
                }
                return false;
            });
        } finally {
            lock.unlock();
        }
    }

    public void clear() {
        lock.lock();
        try {
            cacheMap.clear();
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return cacheMap.size();
        } finally {
            lock.unlock();
        }
    }

    public synchronized double getHitRate() {
        long total = hits + misses;
        if (total == 0) return 0.0;
        return (double) hits / total * 100.0;
    }

    private static class CacheEntry<V> {
        final V value;
        final long timestamp;

        CacheEntry(V value, long timestamp) {
            this.value = value;
            this.timestamp = timestamp;
        }
    }
}
```

---

## 4. Porting Framework Strategies

When applying these Java classes into a Paper/Spigot environment:
1. **Initialize `TickScheduler` on Enable:** In your main `JavaPlugin` class `onEnable()`, call `TickScheduler.init(this)`. Schedule a recurring async task every 20 ticks to run `CacheManager#sweepExpired()` for all your active cache instances.
2. **Decouple SQL Writes with `SignalBus`:** When an economy change happens, do not write to SQL synchronously. Emit a signal like `SignalBus.emit("economy:balance_update", playerUuid, newBalance)`. Subscribe a database module asynchronously to listen to that signal and write to the DB on a thread-pool worker.
3. **Prevent Thread Safety Exploits:** The `CacheManager` uses a `ReentrantLock` instead of standard synchronization to protect the `LinkedHashMap` structure, making it completely safe to call `.get()` from the main server thread while async threads do background `.put()` database updates.
