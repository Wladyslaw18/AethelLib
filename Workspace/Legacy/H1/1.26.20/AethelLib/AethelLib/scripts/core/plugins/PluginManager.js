import { Kernel } from "../Kernel.js"

/**
 * Industrial Plugin Manager (V3)
 * ----------------------------------------------------------------------------
 * Handles the heavy lifting of importing and validating plugin manifests.
 * Decouples the file-system loading from the Kernel's service registry.
 */
export const PluginManager = {
    _plugins: new Map(),

    /**
     * INDUCTION_VECTOR
     * Performs a defensive import of a plugin module via its provided loader.
     */
    async load(pluginDef) {
        try {
            // Step 1: Execute Dynamic Import from the original context
            const module = await pluginDef.loader();
            const path = pluginDef.path;
            const manifest = module.manifest;
            
            // Step 2: Validate Export Structure
            if (!manifest || !module.main) {
                console.error(`[PluginManager] INVALID_STRUCTURE at '${path}': Missing manifest or main export.`);
                return false;
            }

            // 🔥 DEPENDENCY VALIDATION
            if (manifest.dependencies) {
                for (const dep of manifest.dependencies) {
                    const depId = typeof dep === 'string' ? dep : dep.id;
                    if (!this._plugins.has(depId)) {
                        console.error(`[PluginManager] FATAL: '${manifest.id}' is missing dependency '${depId}'. Induction aborted.`);
                        return false;
                    }
                    // TODO: Implement SemVer comparison here (e.g. ^1.2.0 vs 1.1.0)
                }
            }

            // Step 3: Register with Kernel
            Kernel.registerPlugin(manifest, module.main);
            
            this._plugins.set(manifest.id, {
                path,
                manifest,
                loadedAt: Date.now()
            });

            return true;
        } catch (error) {
            console.error(`[PluginManager] LOAD_FAILURE at '${pluginDef.path}':`, error);
            return false;
        }
    },

    /**
     * BATCH_INDUCTION
     */
    async loadAll(pluginDefs) {
        console.log(`[PluginManager] Inducting ${pluginDefs.length} vectors...`);
        const results = await Promise.all(pluginDefs.map(p => this.load(p)));
        const successCount = results.filter(r => !!r).length;
        console.log(`[PluginManager] Induction complete: ${successCount}/${pluginDefs.length} ready.`);
    },

    getManifest(id) {
        return this._plugins.get(id)?.manifest || null;
    }
}
