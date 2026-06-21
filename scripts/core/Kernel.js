import * as mc from "@minecraft/server";
import * as mcui from "@minecraft/server-ui";
import { TickScheduler } from "./scheduler/TickScheduler.js";
import { SignalBus } from "./signalbus/SignalBus.js";
import { DependencySorter } from "../utils/DependencySorter.js";

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
    static #disabledSystems = new Set();
    static #systemProxy = null;
    static #nullFunctions = new Map();

    // ----------------------------------------------------------------------------
    // | native proxies                                                           |
    // | wrapping these so we don't have to import @minecraft/server everywhere.  |
    // | also makes it easier to mock things if we ever get unit tests (doubt).   |
    // ----------------------------------------------------------------------------
    
    // the world object. basically everything that exists.
    static get world() { return mc.world; }
    // the system object. handles ticks and run loops.
    static get system() {
        if (!this.#systemProxy) {
            try {
                this.#systemProxy = new Proxy(mc.system, {
                    get(target, prop) {
                        if (prop === "currentTick") {
                            try {
                                const tick = target.currentTick;
                                if (typeof tick === "number") return tick;
                            } catch (e) {}
                            return Math.floor(Date.now() / 50);
                        }
                        const val = Reflect.get(target, prop);
                        if (typeof val === "function") return val.bind(target);
                        return val;
                    }
                });
            } catch (e) {
                return mc.system;
            }
        }
        return this.#systemProxy;
    }
    // helper to see how many services are currently alive.
    static get size() { return this.#systems.size; }
    // helper to see all registered systems
    static get systems() { return this.#systems; }
    // helper to see all disabled systems
    static get disabledSystems() { return this.#disabledSystems; }

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
    static get GameMode() { return mc.GameMode; }
    static get EquipmentSlot() { return mc.EquipmentSlot; }
    static get BlockPermutation() { return mc.BlockPermutation; }
    static get BlockComponentTypes() { return mc.BlockComponentTypes; }
    static get InputPermissionCategory() { return mc.InputPermissionCategory; }

    // ----------------------------------------------------------------------------
    // | ui proxies                                                               |
    // | server-ui forms. standard stuff for player interaction.                  |
    // ----------------------------------------------------------------------------
    static get ActionFormData() { return mcui.ActionFormData; }
    static get ModalFormData() { return mcui.ModalFormData; }
    static get MessageFormData() { return mcui.MessageFormData; }

    /**
     * Wrap a native Bedrock Entity or Player in a Stable Safe Proxy.
     * Prevents InvalidEntityError C++ crashes when interacting with disconnected players or unloaded entities.
     */
    static wrapEntity(entity) {
        if (!entity || typeof entity !== "object") return entity;
        
        // If it's already a safe proxy, don't wrap it again
        if (entity.__rawEntity__) return entity;

        return new Proxy(entity, {
            get(target, prop, receiver) {
                if (prop === "__rawEntity__") return target;

                let isValid = false;
                try {
                    isValid = target.isValid;
                } catch (e) {}

                if (!isValid) {
                    if (prop === "isValid") return false;
                    if (prop === "location") return { x: 0, y: 0, z: 0 };
                    if (prop === "dimension") {
                        return {
                            id: "minecraft:overworld",
                            runCommand: () => ({ successCount: 0 }),
                            runCommandAsync: () => Promise.resolve({ successCount: 0 }),
                            getBlock: () => null,
                            spawnEntity: () => null
                        };
                    }
                    if (prop === "name" || prop === "nameTag" || prop === "id" || prop === "typeId") {
                        try { return target[prop]; } catch (e) { return ""; }
                    }
                    
                    const dummyVal = undefined;
                    try {
                        const original = target[prop];
                        if (typeof original === "function") {
                            return () => dummyVal;
                        }
                    } catch (e) {}
                    return dummyVal;
                }

                const val = Reflect.get(target, prop, receiver);
                if (typeof val === "function") {
                    return val.bind(target);
                }
                return val;
            }
        });
    }

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
                if (!command) {
                    console.error(`[${manifest.id}] Failed to register command: Command object is null or undefined.`);
                    return;
                }
                // get the global registry
                const registry = this.get("commandRegistry");
                if (!registry) return console.error(`[${manifest.id}] Failed to register command: Registry not found.`);
                // add it to the registry
                registry.register(command);
                // track it so we can unregister it later
                pluginState.activeCommands.push(command.name || "unnamed");
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
            log: (msg) => console.log(`\u00A78[\u00A7b${manifest.id}\u00A78] \u00A7f${msg}`),
            error: (msg) => console.error(`\u00A78[\u00A7c${manifest.id}\u00A78] \u00A7cERROR: ${msg}`)
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
    // | returns a Null Object proxy if the system is registered but disabled.    |
    // ----------------------------------------------------------------------------
    static get(id) {
        if (this.#disabledSystems.has(id)) {
            const instance = this.#systems.get(id) || this.#serviceProviders.get(id);
            return this.#createNullProxy(id, instance);
        }
        // try to find it in core systems first, then the plugin service providers.
        return this.#systems.get(id) || this.#serviceProviders.get(id);
    }

    // ----------------------------------------------------------------------------
    // | method: #createNullProxy                                                 |
    // | creates a robust Null Object Pattern proxy to prevent TypeError crashes. |
    // | returns 0, false, empty arrays, or Promises based on method heuristics.   |
    // ----------------------------------------------------------------------------
    static #createNullProxy(id, instance) {
        const target = instance || {};
        
        return new Proxy(target, {
            get(obj, prop, receiver) {
                // bypass special properties and promise checks
                if (prop === "then") return undefined;
                if (prop === "toJSON") return () => null;
                if (prop === "valueOf") return () => 0;
                if (prop === "toString") return () => `[DisabledSystemProxy:${id}]`;
                if (prop === Symbol.toPrimitive) {
                    return (hint) => {
                        if (hint === "number") return 0;
                        if (hint === "string") return "";
                        return false;
                    };
                }

                let originalValue;
                try {
                    originalValue = obj[prop];
                } catch (e) {
                    // fall through
                }

                if (typeof originalValue === "function") {
                    if (Kernel.#nullFunctions.has(prop)) {
                        return Kernel.#nullFunctions.get(prop);
                    }
                    
                    const fn = (...args) => {
                        const name = String(prop).toLowerCase();
                        
                        // Check if it's a generator function
                        if (originalValue.constructor.name === "GeneratorFunction") {
                            return (function*() {})();
                        }

                        // Heuristic check: is it an async method?
                        const isAsync = originalValue.constructor.name === "AsyncFunction" || 
                                        name.startsWith("async") || 
                                        name.includes("transaction") || 
                                        name.includes("transfer") || 
                                        name.includes("setbalance") || 
                                        name.includes("addmoney") || 
                                        name.includes("removemoney") || 
                                        name.includes("hasenough");

                        // Resolve default value based on method name patterns
                        let val;
                        if (name.startsWith("get") || name.includes("balance") || name.includes("count") || name.includes("price") || name.includes("size") || name.includes("amount")) {
                            if (name.includes("player") || name.includes("account") || name.includes("system") || name.includes("service")) {
                                val = null;
                            } else if (name.includes("leaderboard") || name.includes("balances") || name.includes("list") || name.includes("all")) {
                                val = [];
                            } else {
                                val = 0;
                            }
                        } else if (name.startsWith("is") || name.startsWith("has") || name.startsWith("can") || name.startsWith("pay") || name.startsWith("charge") || name.startsWith("withdraw") || name.startsWith("deposit") || name.startsWith("save") || name.startsWith("set") || name.startsWith("delete") || name.startsWith("remove") || name.startsWith("add") || name.startsWith("update") || name.startsWith("disable") || name.startsWith("enable") || name.startsWith("transfer")) {
                            val = false;
                        } else {
                            val = undefined;
                        }

                        return isAsync ? Promise.resolve(val) : val;
                    };
                    
                    Kernel.#nullFunctions.set(prop, fn);
                    return fn;
                }

                // If they access non-function properties directly
                const name = String(prop).toLowerCase();
                if (name.includes("balance") || name.includes("limit") || name.includes("default")) {
                    return 0;
                }

                return undefined;
            }
        });
    }

    // ----------------------------------------------------------------------------
    // | method: has                                                              |
    // | quick check to see if a service exists.                                  |
    // ----------------------------------------------------------------------------
    static has(id) {
        if (this.#disabledSystems.has(id)) return false;
        // check both maps.
        return this.#systems.has(id) || this.#serviceProviders.has(id);
    }

    // ----------------------------------------------------------------------------
    // | method: disableSystem                                                    |
    // | dynamically disables a core system and runs its shutdown hooks.           |
    // ----------------------------------------------------------------------------
    static disableSystem(id) {
        if (this.#disabledSystems.has(id)) return false;

        // Retrieve instance directly to bypass disabled check
        const instance = this.#systems.get(id) || this.#serviceProviders.get(id);
        if (instance) {
            try {
                if (typeof instance.shutdown === "function") {
                    instance.shutdown();
                } else if (typeof instance.onDisable === "function") {
                    instance.onDisable();
                } else if (typeof instance.disable === "function") {
                    instance.disable();
                }
            } catch (e) {
                console.error(`[Kernel] Error during system '${id}' shutdown hook: ${e}`);
            }
        }
        this.#disabledSystems.add(id);
        return true;
    }

    // ----------------------------------------------------------------------------
    // | method: enableSystem                                                     |
    // | dynamically enables a disabled core system and runs its init hooks.      |
    // ----------------------------------------------------------------------------
    static enableSystem(id) {
        if (!this.#disabledSystems.has(id)) return false;

        this.#disabledSystems.delete(id);

        // Retrieve instance directly to bypass disabled check
        const instance = this.#systems.get(id) || this.#serviceProviders.get(id);
        if (instance) {
            try {
                if (typeof instance.init === "function") {
                    instance.init();
                } else if (typeof instance.onEnable === "function") {
                    instance.onEnable();
                } else if (typeof instance.enable === "function") {
                    instance.enable();
                }
            } catch (e) {
                console.error(`[Kernel] Error during system '${id}' init hook: ${e}`);
            }
        }
        return true;
    }

    // ----------------------------------------------------------------------------
    // | method: bootPlugins                                                      |
    // | the big bang. starts every registered plugin in the right order.         |
    // | uses a dependency sorter so we don't crash.                              |
    // ----------------------------------------------------------------------------
    static bootPlugins() {
        console.log("[Kernel] booting plugins...");
        
        // sort the plugins so dependencies load first.
        let sorted = [];
        try {
            sorted = this._sortPlugins();
        } catch (error) {
            console.error(`[Kernel] DEPENDENCY_SORT_FAILED: Circular dependencies or references detected. Falling back to staging order.`, error);
            sorted = Array.from(this.#plugins.keys());
        }
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
        return DependencySorter.sort(Array.from(this.#plugins.keys()), {
            getDependencies: (id) => this.#plugins.get(id)?.manifest?.dependencies || [],
            hasNode: (id) => this.#plugins.has(id),
            onMissingDependency: (id, dep) => {
                console.warn(`[Kernel] Warning: Dependency '${dep}' is missing and will be skipped.`);
            },
            errorMessagePrefix: "Circular dependency detected: "
        });
    }
}

