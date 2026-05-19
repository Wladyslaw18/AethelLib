import { Kernel } from "../Kernel.js"

// central nervous system for external modules.
// handles dep resolution, api sharing, and prevents plugins from nuking each other's databases.
export const PluginManager = {
    _plugins: new Map(),
    _apis: new Map(), // the service mesh. where plugins dump their public functions.

    async load(pluginDef) {
        try {
            // dynamic import. if this throws, check your path in the loader index.
            const module = await pluginDef.loader();
            const manifest = module.manifest;
            const logic = module.main || module.default;

            if (!manifest || !logic) {
                console.error(`[PluginManager] FATAL: Module at '${pluginDef.path}' is missing exports. Check manifest/main.`);
                return false;
            }

            // the sandbox object passed to every plugin.
            // do not pass the raw Kernel here or they will break the core.
            const context = {
                manifest,
                // db wrapper. forces a prefix so plugins don't overwrite each other's keys.
                // took me 3 hours to debug a namespace collision last week, don't bypass this.
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
                log: (msg) => console.log(`[${manifest.id}] ${msg}`),
                error: (msg) => console.error(`[${manifest.id}] ERROR: ${msg}`)
            };

            this._plugins.set(manifest.id, {
                manifest,
                logic,
                context,
                state: "LOADED" 
            });

            return true;
        } catch (error) {
            console.error(`[PluginManager] IMPORT CRASH '${pluginDef.path}':`, error);
            return false;
        }
    },

    // the big bang. loads everything into ram and sorts out the mess.
    async loadAll(pluginDefs) {
        console.log(`[PluginManager] Fetching ${pluginDefs.length} modules...`);
        await Promise.all(pluginDefs.map(p => this.load(p)));
        
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

    // topological sort.
    // if plugin A needs B, and B needs A, this will throw and stop the server from hanging permanently.
    _resolveDependencies() {
        const nodes = Array.from(this._plugins.keys());
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (id) => {
            if (visiting.has(id)) throw new Error(`CIRCULAR DEPENDENCY DETECTED: ${id}. Fix your manifests.`);
            if (visited.has(id)) return;

            visiting.add(id);
            const plugin = this._plugins.get(id);
            
            if (plugin?.manifest.dependencies) {
                for (const dep of plugin.manifest.dependencies) {
                    if (!this._plugins.has(dep)) {
                        console.warn(`[PluginManager] WARNING: '${id}' requires missing module '${dep}'. Expect crashes.`);
                        continue;
                    }
                    // recursive dive to ensure the dependency loads first.
                    visit(dep); 
                }
            }
            
            visiting.delete(id);
            visited.add(id);
            sorted.push(id);
        };

        nodes.forEach(id => {
            if (!visited.has(id)) visit(id);
        });
        
        return sorted;
    }
}
