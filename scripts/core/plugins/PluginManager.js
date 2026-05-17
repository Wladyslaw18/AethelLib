import { Kernel } from "../Kernel.js"

// ----------------------------------------------------------------------------
// | PluginManager                                                            |
// | handles the discovery and initialization of external plugin modules.      |
// | checks manifests, validates dependencies, and registers with the kernel.  |
// ----------------------------------------------------------------------------

export const PluginManager = {
    // track loaded plugins in a map for easy lookup.
    _plugins: new Map(),

    // ----------------------------------------------------------------------------
    // | load                                                                     |
    // | the actual loader logic. imports the file and validates its guts.        |
    // ----------------------------------------------------------------------------
    async load(pluginDef) {
        try {
            // step 1: call the loader function provided by main.js.
            // this is a dynamic import that returns the module exports.
            const module = await pluginDef.loader();
            const path = pluginDef.path;
            const manifest = module.manifest;
            
            // step 2: check if the plugin is actually valid.
            // it MUST have a manifest (name, id, version) and a main entry function.
            if (!manifest || !module.main) {
                console.error(`[PluginManager] bad plugin at '${path}': missing manifest or main export.`);
                return false;
            }

            // check dependencies.
            // if a plugin requires another plugin to run, it must be loaded first.
            if (manifest.dependencies) {
                for (const dep of manifest.dependencies) {
                    // dependencies can be just a string id or a more complex object.
                    const depId = typeof dep === 'string' ? dep : dep.id;
                    // check if the required plugin is already in our loaded map.
                    if (!this._plugins.has(depId)) {
                        console.error(`[PluginManager] missing dependency '${depId}' for '${manifest.id}'. skipping.`);
                        return false;
                    }
                    // future note: we should probably check versions here too. 
                    // right now we just check if it exists at all.
                }
            }

            // step 3: register with the kernel.
            // this gives the plugin its 'Context' (commands, database, etc).
            Kernel.registerPlugin(manifest, module.main);
            
            // save the plugin info for later.
            this._plugins.set(manifest.id, {
                path,
                manifest,
                loadedAt: Date.now()
            });

            return true;
        } catch (error) {
            // catch syntax errors or network issues during import.
            console.error(`[PluginManager] LOAD_FAILURE at '${pluginDef.path}':`, error);
            return false;
        }
    },

    // ----------------------------------------------------------------------------
    // | loadAll                                                                  |
    // | processes a batch of plugin definitions.                                 |
    // ----------------------------------------------------------------------------
    async loadAll(pluginDefs) {
        console.log(`[PluginManager] loading ${pluginDefs.length} plugins...`);
        // run all loaders in parallel using promise.all.
        const results = await Promise.all(pluginDefs.map(p => this.load(p)));
        // count how many actually worked.
        const successCount = results.filter(r => !!r).length;
        console.log(`[PluginManager] done. ${successCount}/${pluginDefs.length} loaded.`);
    },

    // ----------------------------------------------------------------------------
    // | getManifest                                                              |
    // | helper to get the manifest of a loaded plugin by its id.                 |
    // ----------------------------------------------------------------------------
    getManifest(id) {
        return this._plugins.get(id)?.manifest || null;
    }
}
