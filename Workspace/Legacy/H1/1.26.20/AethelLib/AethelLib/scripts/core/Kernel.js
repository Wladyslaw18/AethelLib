import * as mc from "@minecraft/server";
import * as mcui from "@minecraft/server-ui";
import { TickScheduler } from "./scheduler/TickScheduler.js";
import { SignalBus } from "./signalbus/SignalBus.js";

/**
 * Central kernel that manages services and proxies native Minecraft APIs.
 * This keeps the rest of the codebase stable if the native API changes.
 */
export class Kernel {
    // Stores registered system instances
    static #systems = new Map();
    // Stores registered external plugins
    static #plugins = new Map();
    // Stores cross-plugin service providers
    static #serviceProviders = new Map();

    /**
     * Proxies for native Minecraft objects
     */
    static get world() { return mc.world; }
    static get system() { return mc.system; }
    static get size() { return this.#systems.size; }

    /**
     * Proxies for common Minecraft types
     */
    static get ItemStack() { return mc.ItemStack; }
    static get EntityComponentTypes() { return mc.EntityComponentTypes; }
    static get SignSide() { return mc.SignSide; }
    static get CustomCommandStatus() { return mc.CustomCommandStatus; }
    static get CustomCommandParamType() { return mc.CustomCommandParamType; }
    static get CommandPermissionLevel() { return mc.CommandPermissionLevel; }

    /**
     * Proxies for UI forms
     */
    static get ActionFormData() { return mcui.ActionFormData; }
    static get ModalFormData() { return mcui.ModalFormData; }
    static get MessageFormData() { return mcui.MessageFormData; }

    /**
     * Register a new service or system
     */
    static register(id, instance) {
        if (this.#systems.has(id)) {
            console.warn(`[Kernel] Service collision: identifier '${id}' is already registered. Overwriting.`);
        }
        this.#systems.set(id, instance);
        console.log("[Kernel] Service registered: " + id);
    }

    /**
     * Register an external plugin or sub-mod (V3 Orchestrator Standard)
     * @param {Object} manifest - { id, name, version, dependencies: [] }
     * @param {Function|Object} logic - Callback or object with onInit/onEnable
     */
    static registerPlugin(manifest, logic) {
        if (!manifest.id || !logic) {
            console.error("[Kernel] Invalid plugin registration: Missing ID or Logic.");
            return;
        }

        // 🛡️ ISOLATED PLUGIN SANDBOX
        // Tracks everything this plugin does so we can nuke it if it unloads
        const pluginState = {
            id: manifest.id,
            activeCommands:[],
            activeIntervals: [],
            activeListeners:[]
        };

        const context = {
            id: manifest.id,
            name: manifest.name || manifest.id,
            version: manifest.version,
            
            // Scoped Command Registration
            registerCommand: (command) => {
                const registry = this.get("commandRegistry");
                if (!registry) return console.error(`[${manifest.id}] Failed to register command: Registry not found.`);
                registry.register(command);
                pluginState.activeCommands.push(command.name);
            },

            // Scoped Schedulers (Auto-cleans on disable)
            setInterval: (callback, ticks) => {
                const id = TickScheduler.schedule(callback, ticks, { name: `${manifest.id}_interval` });
                pluginState.activeIntervals.push(id);
                return id;
            },

            // Scoped Event Bus (Auto-unsubscribes)
            onSignal: (event, callback) => {
                const unsubscribe = SignalBus.on(event, callback);
                pluginState.activeListeners.push(unsubscribe);
            },

            getService: (id) => this.get(id) || this.#serviceProviders.get(id),
            
            exposeService: (id, instance) => {
                this.#serviceProviders.set(id, instance);
                console.log(`[Kernel] Service Exposed: ${id} by ${manifest.id}`);
            },

            log: (msg) => console.log(`§8[§b${manifest.id}§8] §f${msg}`),
            error: (msg) => console.error(`§8[§c${manifest.id}§8] §cERROR: ${msg}`)
        };

        this.#plugins.set(manifest.id, { manifest, logic, context, state: "STAGED", tracker: pluginState });
        console.log(`[Kernel] Plugin staged: ${manifest.id} v${manifest.version}`);
    }

    // 🔥 NEW: HOT-RELOAD / DISABLE PROTOCOL
    static unloadPlugin(id) {
        const plugin = this.#plugins.get(id);
        if (!plugin) return;

        plugin.context.log("Initiating decommission sequence...");

        // 1. Run plugin's custom shutdown logic
        if (typeof plugin.logic.onDisable === "function") {
            plugin.logic.onDisable(plugin.context);
        }

        // 2. Nuke tracked tasks
        if (plugin.tracker && plugin.tracker.activeIntervals) {
            plugin.tracker.activeIntervals.forEach(taskId => TickScheduler.cancel(taskId));
        }
        
        // 3. Nuke tracked event listeners
        if (plugin.tracker && plugin.tracker.activeListeners) {
            plugin.tracker.activeListeners.forEach(unsub => unsub());
        }

        // 4. Unregister commands
        const registry = this.get("commandRegistry");
        if (registry && plugin.tracker && plugin.tracker.activeCommands) {
            plugin.tracker.activeCommands.forEach(cmd => registry.unregister(cmd));
        }

        plugin.state = "DECOMMISSIONED";
        this.#plugins.delete(id);
        console.log(`[Kernel] Purged plugin: ${id}`);
    }

    /**
     * Get a registered service or service provider by its ID
     */
    static get(id) {
        return this.#systems.get(id) || this.#serviceProviders.get(id);
    }

    /**
     * Check if a service or service provider is registered
     */
    static has(id) {
        return this.#systems.has(id) || this.#serviceProviders.has(id);
    }

    /**
     * Initialize all registered plugins using topological ordering
     * Resolves dependencies before execution to prevent null-pointer crashes.
     */
    static bootPlugins() {
        console.log("[Kernel] Initializing Industrial Orchestrator boot-sequence...");
        
        const sorted = this._sortPlugins();
        let successCount = 0;

        for (const id of sorted) {
            const plugin = this.#plugins.get(id);
            try {
                if (typeof plugin.logic === "function") {
                    plugin.logic(plugin.context);
                } else if (plugin.logic.onInit) {
                    plugin.logic.onInit(plugin.context);
                }
                
                plugin.state = "ACTIVE";
                successCount++;
            } catch (error) {
                console.error(`[Kernel] FATAL ERROR in plugin '${id}':`, error);
                plugin.state = "FAILED";
            }
        }
        
        console.log(`[Kernel] V3 Boot complete. Plugins active: ${successCount}/${this.#plugins.size}`);
    }

    /**
     * INTERNAL: TOPOLOGICAL_SORTER
     * ----------------------------------------------------------------------------
     * Resolves the dependency graph to ensure correct load order.
     */
    static _sortPlugins() {
        const nodes = Array.from(this.#plugins.keys());
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (id) => {
            if (visiting.has(id)) throw new Error(`Circular dependency detected: ${id}`);
            if (visited.has(id)) return;

            visiting.add(id);
            const plugin = this.#plugins.get(id);
            if (plugin?.manifest.dependencies) {
                for (const dep of plugin.manifest.dependencies) {
                    visit(dep);
                }
            }
            visiting.delete(id);
            visited.add(id);
            sorted.push(id);
        };

        nodes.forEach(id => visit(id));
        return sorted;
    }
}

