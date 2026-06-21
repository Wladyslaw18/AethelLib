import { Kernel } from "../Kernel.js"
import { DependencySorter } from "../../utils/DependencySorter.js"

// central nervous system for external modules.
// handles dep resolution, api sharing, and prevents plugins from nuking each other's databases.
export const PluginManager = {
    _plugins: new Map(),
    _apis: new Map(), // the service mesh. where plugins dump their public functions.
    _commandManifests: new Map(), // pluginId -> { manifest, commands, logic }

    _createContext(manifest) {
        const activeIntervals = [];
        const activeTimeouts = [];
        const activeListeners = [];

        // Pre-create event proxies once per context to prevent GC pressure
        const createEventProxy = (sourceObj) => new Proxy({}, {
            get(eventsDummyTarget, eventName) {
                const originalEvent = sourceObj[eventName];
                if (originalEvent && typeof originalEvent.subscribe === "function") {
                    return {
                        subscribe: (callback, options) => {
                            if (options !== undefined) {
                                originalEvent.subscribe(callback, options);
                            } else {
                                originalEvent.subscribe(callback);
                            }
                            const unsubscribe = () => {
                                try { originalEvent.unsubscribe(callback); } catch(e) {}
                            };
                            activeListeners.push(unsubscribe);
                            return callback;
                        },
                        unsubscribe: (callback) => {
                            try { originalEvent.unsubscribe(callback); } catch(e) {}
                        }
                    };
                }
                return originalEvent;
            }
        });

        const cachedBeforeEvents = createEventProxy(Kernel.world.beforeEvents);
        const cachedAfterEvents = createEventProxy(Kernel.world.afterEvents);

        const context = {
            manifest,
            // db wrapper. forces a prefix so plugins don't overwrite each other's keys.
            db: {
                get: (key) => Kernel.get("database").get(`plugin:${manifest.id}:${key}`),
                set: (key, val) => Kernel.get("database").set(`plugin:${manifest.id}:${key}`, val),
                delete: (key) => Kernel.get("database").delete(`plugin:${manifest.id}:${key}`)
            },
            // api exposure. how plugins talk to each other without circular imports.
            exportAPI: (apiObject) => {
                this._apis.set(manifest.id, apiObject);
                console.log(`[PluginManager] API bound: ${manifest.id}`);
            },
            // api consumption. throws if the dependency isn't loaded yet.
            requireAPI: (pluginId) => {
                if (!this._apis.has(pluginId)) {
                    throw new Error(`[PluginManager] Missing API for dependency: ${pluginId}. Check load order.`);
                }
                return this._apis.get(pluginId);
            },
            // safe core access
            getService: (id) => Kernel.get(id),
            registerCommand: (cmd) => {
                const registry = Kernel.get("commandRegistry");
                if (!registry) {
                    console.error(`[PluginManager] Failed to register command for '${manifest.id}': commandRegistry is offline.`);
                    return;
                }
                registry.register(cmd);
            },
            log: (msg) => console.log(`\u00A78[\u00A7b${manifest.id}\u00A78] \u00A7f${msg}`),
            error: (msg) => console.error(`\u00A78[\u00A7c${manifest.id}\u00A78] \u00A7cERROR: ${msg}`),

            // Proxied Engine interfaces (Stable Proxy Pattern + Preemptive Resource Registry)
            system: new Proxy({}, {
                get(dummyTarget, prop) {
                    if (prop === "runInterval") {
                        return (callback, ticks) => {
                            const id = Kernel.system.runInterval(callback, ticks);
                            activeIntervals.push(id);
                            return id;
                        };
                    }
                    if (prop === "runTimeout") {
                        return (callback, ticks) => {
                            const id = Kernel.system.runTimeout(callback, ticks);
                            activeTimeouts.push(id);
                            return id;
                        };
                    }
                    if (prop === "clearRun") {
                        return (id) => {
                            Kernel.system.clearRun(id);
                            const intIdx = activeIntervals.indexOf(id);
                            if (intIdx !== -1) activeIntervals.splice(intIdx, 1);
                            const timeoutIdx = activeTimeouts.indexOf(id);
                            if (timeoutIdx !== -1) activeTimeouts.splice(timeoutIdx, 1);
                        };
                    }
                    const val = Kernel.system[prop];
                    if (typeof val === "function") return val.bind(Kernel.system);
                    return val;
                }
            }),

            world: new Proxy({}, {
                get(dummyTarget, prop) {
                    if (prop === "afterEvents") return cachedAfterEvents;
                    if (prop === "beforeEvents") return cachedBeforeEvents;
                    const val = Kernel.world[prop];
                    if (typeof val === "function") return val.bind(Kernel.world);
                    return val;
                }
            })
        };

        // Attach resources tracking to the context object privately
        context._resources = { activeIntervals, activeTimeouts, activeListeners };
        return context;
    },

    /**
     * Phase 0: Synchronously extract command definitions from a plugin module
     * Does NOT execute onEnable – only reads static command objects.
     */
    async extractCommands(pluginDef) {
        try {
            const module = await pluginDef.loader();
            const manifest = module.manifest;
            const logic = module.main || module.default;

            if (!manifest || !logic) {
                console.error(`[PluginManager] FATAL: Module at '${pluginDef.path}' is missing exports. Check manifest/main.`);
                return null;
            }

            // Extract commands from the plugin's exported command objects
            const commands = [];
            if (typeof module.getCommands === 'function') {
                commands.push(...module.getCommands());
            } else if (typeof logic.getCommands === 'function') {
                commands.push(...logic.getCommands());
            } else {
                // Fallback: scan for exported command objects (convention: *Command.js exports)
                for (const key of Object.keys(module)) {
                    if (key.endsWith('Command') && module[key] && typeof module[key].execute === 'function') {
                        commands.push(module[key]);
                    }
                }
            }

            this._commandManifests.set(manifest.id, { manifest, commands, logic });
            
            // Set initial state
            this._plugins.set(manifest.id, {
                manifest,
                logic,
                context: this._createContext(manifest),
                state: "LOADED"
            });

            return manifest.id;
        } catch (error) {
            console.error(`[PluginManager] IMPORT CRASH '${pluginDef.path}':`, error);
            return null;
        }
    },

    /**
     * Phase 0: Register all extracted commands to native engine
     * Called synchronously before initCommands()
     */
    stageAllSync() {
        for (const [id, data] of this._commandManifests.entries()) {
            const { manifest, commands, logic } = data;
            const plugin = this._plugins.get(id);
            if (!plugin) continue;
            
            const context = plugin.context;

            // Allow manual registration via onStage hook if they prefer it over getCommands
            if (typeof logic.onStage === "function") {
                try {
                    logic.onStage(context);
                } catch(e) {
                    console.error(`[PluginManager] onStage Crash in ${id}: ${e}`);
                }
            }

            // Register extracted commands automatically
            for (const cmd of commands) {
                if (!cmd) continue;
                try {
                    cmd.context = context; // Inject context for proxy pattern
                    context.registerCommand(cmd); // talks to CommandRegistry
                } catch (e) {
                    console.error(`[PluginManager] Failed to register command ${cmd?.name || "unknown"} from ${manifest.id}: ${e}`);
                }
            }
            
            plugin.state = "STAGED";
        }
    },

    /**
     * Phase 2: Async enable – load databases, listeners, etc.
     */
    async enableAll() {
        console.log(`[PluginManager] Resolving dependency graph...`);
        let sortedIds = [];
        try {
            sortedIds = this._resolveDependencies();
        } catch (error) {
            console.error(`[PluginManager] DEPENDENCY_RESOLUTION_CRASH: Graph resolution failed due to circular bounds. Falling back to raw load order.`, error);
            sortedIds = Array.from(this._plugins.keys());
        }
        
        let successCount = 0;
        
        // boot sequence. strictly ordered to prevent undefined references.
        for (const id of sortedIds) {
            const plugin = this._plugins.get(id);
            if (!plugin) continue;

            try {
                plugin.state = "ENABLING";
                
                // support both class-based lifecycle hooks and raw functions.
                if (typeof plugin.logic.onEnable === "function") {
                    await plugin.logic.onEnable(plugin.context);
                } else if (typeof plugin.logic === "function") {
                    await plugin.logic(plugin.context);
                }

                plugin.state = "ACTIVE";
                successCount++;
            } catch (error) {
                console.error(`[PluginManager] BOOT FAILURE in '${id}':`, error);
                plugin.state = "FAILED";
            }
        }
        console.log(`[PluginManager] System Online. Active modules: ${successCount}/${this._plugins.size}`);
    },

    _resolveDependencies() {
        return DependencySorter.sort(Array.from(this._plugins.keys()), {
            getDependencies: (id) => this._plugins.get(id)?.manifest?.dependencies || [],
            hasNode: (id) => this._plugins.has(id),
            onMissingDependency: (id, dep) => {
                console.warn(`[PluginManager] WARNING: '${id}' requires missing module '${dep}'. Expect crashes.`);
            },
            errorMessagePrefix: "CIRCULAR DEPENDENCY DETECTED: "
        });
    },

    async reloadPlugin(pluginId) {
        // Find matching active plugin by id (e.g. "aethel:core_economy") or path (e.g. "CoreEconomy")
        let activePluginId = null;
        let matchedDef = null;

        for (const [id, plugin] of this._plugins.entries()) {
            if (id === pluginId || id.toLowerCase() === pluginId.toLowerCase()) {
                activePluginId = id;
                break;
            }
            if (plugin.manifest.name && plugin.manifest.name.toLowerCase() === pluginId.toLowerCase()) {
                activePluginId = id;
                break;
            }
        }

        // Search in pluginDefs
        const { pluginDefs } = await import("../../plugins/PluginLoader.js");
        for (const def of pluginDefs) {
            if (def.path === pluginId || def.path.toLowerCase() === pluginId.toLowerCase()) {
                matchedDef = def;
                break;
            }
        }

        // If we found an active plugin ID but no matchedDef, match by name mapping
        if (activePluginId && !matchedDef) {
            const suffix = activePluginId.split(":")[1]; // e.g. "core_economy"
            matchedDef = pluginDefs.find(d => {
                const normPath = d.path.toLowerCase().replace(/_/g, "");
                const normSuffix = suffix?.toLowerCase().replace(/_/g, "");
                return normPath === normSuffix || normPath.includes(normSuffix) || normSuffix.includes(normPath);
            });
        }

        if (!matchedDef) {
            throw new Error(`Plugin definition for '${pluginId}' not found in PluginLoader.`);
        }

        const targetId = activePluginId || matchedDef.path;

        // 1. Unload the plugin if it's currently active/staged
        if (this._plugins.has(targetId)) {
            const plugin = this._plugins.get(targetId);
            
            // Run onDisable
            if (plugin.state === "ACTIVE" && typeof plugin.logic.onDisable === "function") {
                try {
                    await plugin.logic.onDisable(plugin.context);
                } catch (e) {
                    console.error(`[PluginManager] Error disabling plugin '${targetId}' during reload: ${e}`);
                }
            }

            // Unregister commands
            const registry = Kernel.get("commandRegistry");
            const commandData = this._commandManifests.get(targetId);
            if (registry && commandData && commandData.commands) {
                for (const cmd of commandData.commands) {
                    if (cmd && cmd.name) {
                        registry.unregister(cmd.name);
                    }
                }
            }

            // Preemptive Resource Registry cleanup (intervals, timeouts, listeners)
            const context = plugin.context;
            if (context && context._resources) {
                const { activeIntervals, activeTimeouts, activeListeners } = context._resources;

                activeIntervals.forEach(id => {
                    try { Kernel.system.clearRun(id); } catch (e) {
                        console.error(`[PluginManager] Failed clearing interval during reload of ${targetId}: ${e}`);
                    }
                });

                activeTimeouts.forEach(id => {
                    try { Kernel.system.clearRun(id); } catch (e) {
                        console.error(`[PluginManager] Failed clearing timeout during reload of ${targetId}: ${e}`);
                    }
                });

                activeListeners.forEach(unsubscribe => {
                    try { unsubscribe(); } catch (e) {
                        console.error(`[PluginManager] Failed unsubscribing event listener during reload of ${targetId}: ${e}`);
                    }
                });
            }

            // Remove from maps
            this._plugins.delete(targetId);
            this._commandManifests.delete(targetId);
            this._apis.delete(targetId);
        }

        // 2. Dynamic import with cache-buster timestamp query parameter
        let module;
        try {
            const cacheBusterPath = `../../plugins/${matchedDef.path}/index.js?t=${Date.now()}`;
            module = await import(cacheBusterPath);
        } catch (err) {
            console.warn(`[PluginManager] Cache-busting dynamic import failed: ${err}. Falling back to standard loader.`);
            module = await matchedDef.loader();
        }

        const manifest = module.manifest;
        const logic = module.main || module.default;

        if (!manifest || !logic) {
            throw new Error(`Plugin module at '${matchedDef.path}' is missing exports (manifest/main).`);
        }

        const newId = manifest.id;

        // Extract commands
        const commands = [];
        if (typeof module.getCommands === 'function') {
            commands.push(...module.getCommands());
        } else if (typeof logic.getCommands === 'function') {
            commands.push(...logic.getCommands());
        } else {
            for (const key of Object.keys(module)) {
                if (key.endsWith('Command') && module[key] && typeof module[key].execute === 'function') {
                    commands.push(module[key]);
                }
            }
        }

        this._commandManifests.set(newId, { manifest, commands, logic });

        const context = this._createContext(manifest);
        this._plugins.set(newId, {
            manifest,
            logic,
            context,
            state: "LOADED"
        });

        // Stage commands (register them)
        if (typeof logic.onStage === "function") {
            try {
                logic.onStage(context);
            } catch(e) {
                console.error(`[PluginManager] onStage Crash in ${newId}: ${e}`);
            }
        }

        for (const cmd of commands) {
            if (!cmd) continue;
            cmd.context = context;
            context.registerCommand(cmd);
        }

        this._plugins.get(newId).state = "STAGED";

        // Enable plugin (onEnable)
        this._plugins.get(newId).state = "ENABLING";
        if (typeof logic.onEnable === "function") {
            await logic.onEnable(context);
        } else if (typeof logic === "function") {
            await logic(context);
        }

        this._plugins.get(newId).state = "ACTIVE";
        console.log(`[PluginManager] Plugin '${newId}' successfully hot-reloaded!`);
        return newId;
    }
}
