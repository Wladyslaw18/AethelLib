import * as mc from "@minecraft/server";
import * as mcui from "@minecraft/server-ui";
import { TickScheduler } from "./scheduler/TickScheduler.js";
import { SignalBus } from "./signalbus/SignalBus.js";

// ----------------------------------------------------------------------------
// | class: Kernel                                                            |
// | the central nervous system. if this fails, we all go home.               |
// | handles service registration, plugin lifecycles, and native api proxies. |
// ----------------------------------------------------------------------------
export class Kernel {
    // ----------------------------------------------------------------------------
    // | static properties                                                        |
    // | just some maps to keep track of stuff. standard boilerplate.             |
    // ----------------------------------------------------------------------------
    
    // holds the actual system instances (economy, db, etc)
    static #systems = new Map();
    // holds metadata for external plugins
    static #plugins = new Map();
    // holds services that plugins want to share with each other
    static #serviceProviders = new Map();

    // ----------------------------------------------------------------------------
    // | native proxies                                                           |
    // | wrapping these so we don't have to import @minecraft/server everywhere.  |
    // | also makes it easier to mock things if we ever get unit tests (doubt).   |
    // ----------------------------------------------------------------------------
    
    // the world object. basically everything that exists.
    static get world() { return mc.world; }
    // the system object. handles ticks and run loops.
    static get system() { return mc.system; }
    // helper to see how many services are currently alive.
    static get size() { return this.#systems.size; }

    // ----------------------------------------------------------------------------
    // | type proxies                                                             |
    // | because typing out mc.ItemStack 100 times is a waste of life.            |
    // ----------------------------------------------------------------------------
    static get ItemStack() { return mc.ItemStack; }
    static get EntityComponentTypes() { return mc.EntityComponentTypes; }
    static get SignSide() { return mc.SignSide; }
    static get CustomCommandStatus() { return mc.CustomCommandStatus; }
    static get CustomCommandParamType() { return mc.CustomCommandParamType; }
    static get CommandPermissionLevel() { return mc.CommandPermissionLevel; }

    // ----------------------------------------------------------------------------
    // | ui proxies                                                               |
    // | server-ui forms. standard stuff for player interaction.                  |
    // ----------------------------------------------------------------------------
    static get ActionFormData() { return mcui.ActionFormData; }
    static get ModalFormData() { return mcui.ModalFormData; }
    static get MessageFormData() { return mcui.MessageFormData; }

    // ----------------------------------------------------------------------------
    // | method: register                                                         |
    // | put a service into the kernel. don't register the same id twice.         |
    // ----------------------------------------------------------------------------
    static register(id, instance) {
        // check if we're about to overwrite something important
        if (this.#systems.has(id)) {
            console.warn(`[Kernel] Service collision: identifier '${id}' is already registered. Overwriting.`);
        }
        // slap it in the map
        this.#systems.set(id, instance);
        // let the console know we did something
        console.log("[Kernel] Service registered: " + id);
    }

    // ----------------------------------------------------------------------------
    // | method: registerPlugin                                                   |
    // | the entrance for external mods. gives them a sandbox to play in.         |
    // | tracks their commands and listeners so we can kill them if needed.        |
    // ----------------------------------------------------------------------------
    static registerPlugin(manifest, logic) {
        // basic validation. if they didn't give us an id, we're done here.
        if (!manifest.id || !logic) {
            console.error("[Kernel] Missing ID or Logic for plugin.");
            return;
        }

        // we need to track everything the plugin does. 
        // if the plugin unloads, we need to nuke all its residue.
        const pluginState = {
            id: manifest.id,
            activeCommands:[],
            activeIntervals: [],
            activeListeners:[]
        };

        // this is the object we hand to the plugin. 
        // it's their only way to talk to the kernel safely.
        const context = {
            id: manifest.id,
            name: manifest.name || manifest.id,
            version: manifest.version,
            
            // register a command under the plugin's name.
            registerCommand: (command) => {
                // get the global registry
                const registry = this.get("commandRegistry");
                if (!registry) return console.error(`[${manifest.id}] Failed to register command: Registry not found.`);
                // add it to the registry
                registry.register(command);
                // track it so we can unregister it later
                pluginState.activeCommands.push(command.name);
            },

            // set an interval that auto-cleans on plugin shutdown.
            setInterval: (callback, ticks) => {
                // schedule the tick task
                const id = TickScheduler.schedule(callback, ticks, { name: `${manifest.id}_interval` });
                // keep the id for the cleanup crew
                pluginState.activeIntervals.push(id);
                return id;
            },

            // listen for signals. also auto-cleans.
            onSignal: (event, callback) => {
                // subscribe to the signal bus
                const unsubscribe = SignalBus.on(event, callback);
                // keep the unsubscribe function
                pluginState.activeListeners.push(unsubscribe);
            },

            // find a service.
            getService: (id) => this.get(id) || this.#serviceProviders.get(id),
            
            // share a service with other plugins.
            exposeService: (id, instance) => {
                // put it in the public provider map
                this.#serviceProviders.set(id, instance);
                console.log(`[Kernel] Service Exposed: ${id} by ${manifest.id}`);
            },

            // standard logging that includes the plugin id.
            log: (msg) => console.log(`\xA78[\xA7b${manifest.id}\xA78] \xA7f${msg}`),
            error: (msg) => console.error(`\xA78[\xA7c${manifest.id}\xA78] \xA7cERROR: ${msg}`)
        };

        // save the plugin data in our master map.
        this.#plugins.set(manifest.id, { manifest, logic, context, state: "STAGED", tracker: pluginState });
        console.log(`[Kernel] Plugin staged: ${manifest.id} v${manifest.version}`);
    }

    // ----------------------------------------------------------------------------
    // | method: unloadPlugin                                                     |
    // | the decommission sequence. wipes a plugin from existence.                |
    // | clears its intervals, listeners, and commands.                           |
    // ----------------------------------------------------------------------------
    static unloadPlugin(id) {
        // find the plugin in the map
        const plugin = this.#plugins.get(id);
        if (!plugin) return;

        // start the shutdown log
        plugin.context.log("unloading...");

        // if the plugin has custom shutdown logic, run it now.
        if (typeof plugin.logic.onDisable === "function") {
            plugin.logic.onDisable(plugin.context);
        }

        // clear all the tick intervals they scheduled.
        if (plugin.tracker && plugin.tracker.activeIntervals) {
            plugin.tracker.activeIntervals.forEach(taskId => TickScheduler.cancel(taskId));
        }
        
        // nuke all the event listeners they registered.
        if (plugin.tracker && plugin.tracker.activeListeners) {
            plugin.tracker.activeListeners.forEach(unsub => unsub());
        }

        // unregister all their commands from the global registry.
        const registry = this.get("commandRegistry");
        if (registry && plugin.tracker && plugin.tracker.activeCommands) {
            plugin.tracker.activeCommands.forEach(cmd => registry.unregister(cmd));
        }

        // mark it as disabled and delete it from the active map.
        plugin.state = "DISABLED";
        this.#plugins.delete(id);
        console.log(`[Kernel] Purged plugin: ${id}`);
    }

    // ----------------------------------------------------------------------------
    // | method: get                                                              |
    // | fetch a service by its id. checks core systems then plugins.             |
    // ----------------------------------------------------------------------------
    static get(id) {
        // try to find it in core systems first, then the plugin service providers.
        return this.#systems.get(id) || this.#serviceProviders.get(id);
    }

    // ----------------------------------------------------------------------------
    // | method: has                                                              |
    // | quick check to see if a service exists.                                  |
    // ----------------------------------------------------------------------------
    static has(id) {
        // check both maps.
        return this.#systems.has(id) || this.#serviceProviders.has(id);
    }

    // ----------------------------------------------------------------------------
    // | method: bootPlugins                                                      |
    // | the big bang. starts every registered plugin in the right order.         |
    // | uses a dependency sorter so we don't crash.                              |
    // ----------------------------------------------------------------------------
    static bootPlugins() {
        console.log("[Kernel] booting plugins...");
        
        // sort the plugins so dependencies load first.
        const sorted = this._sortPlugins();
        let successCount = 0;

        // iterate through the sorted list and init each one.
        for (const id of sorted) {
            const plugin = this.#plugins.get(id);
            try {
                // call the plugin's main logic or onInit hook.
                if (typeof plugin.logic === "function") {
                    plugin.logic(plugin.context);
                } else if (plugin.logic.onInit) {
                    plugin.logic.onInit(plugin.context);
                }
                
                // if we got here, it's alive.
                plugin.state = "ACTIVE";
                successCount++;
            } catch (error) {
                // something went wrong. kill it.
                console.error(`[Kernel] FATAL ERROR in plugin '${id}':`, error);
                plugin.state = "FAILED";
            }
        }
        
        // finish up the log.
        console.log(`[Kernel] Boot complete. Plugins: ${successCount}/${this.#plugins.size}`);
    }

    // ----------------------------------------------------------------------------
    // | method: _sortPlugins                                                     |
    // | internal helper to sort plugins based on their dependency list.          |
    // | prevents circular dependencies and load-order issues.                    |
    // ----------------------------------------------------------------------------
    static _sortPlugins() {
        // get all the plugin ids
        const nodes = Array.from(this.#plugins.keys());
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        // recursive visit function for the graph.
        const visit = (id) => {
            // if we're visiting it while already visiting it, we have a circle. bad.
            if (visiting.has(id)) throw new Error(`Circular dependency detected: ${id}`);
            // already done this one.
            if (visited.has(id)) return;

            // start visiting.
            visiting.add(id);
            const plugin = this.#plugins.get(id);
            // check for dependencies in the manifest.
            if (plugin?.manifest.dependencies) {
                for (const dep of plugin.manifest.dependencies) {
                    // visit every dependency before we finish this one.
                    visit(dep);
                }
            }
            // finished visiting.
            visiting.delete(id);
            // mark as processed.
            visited.add(id);
            // add to the sorted list.
            sorted.push(id);
        };

        // run the visit on every node.
        nodes.forEach(id => visit(id));
        // return the result.
        return sorted;
    }
}

