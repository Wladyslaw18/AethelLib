⚜︎ AethelLib: The First True Plugin Loader and Runtime Specification

    "First to declare a folder name is not first to build an execution runtime."

AethelLib is the first actual plugin loader in Bedrock scripting history because it solved fundamental software engineering problems that typical script setups didn't even know existed.

In traditional Bedrock scripting, developer "plugin loaders" are nothing more than directory scanners—glorified sequential file-importers that execute top-level code on import, cross their fingers, and hope the server doesn't crash. They treat code like an unmanaged guest that shows up, pollutes the global scope, and stays in memory forever.

AethelLib treats code like a citizen. An isolated process with declared dependencies, sandboxed data boundaries, an active resource registry, and a strict lifecycle.
✦︎ THE GRAPH THEORY ENGINE (Topological DAG Sorter)

A true plugin loader does not load files alphabetically or rely on manual file ordering. It resolves execution paths mathematically.

AethelLib's codebase utilizes a unified, generic DFS-based `DependencySorter` class (located in `scripts/utils/DependencySorter.js`) to sort plugin execution paths mathematically:
```javascript
// DependencySorter.js
export class DependencySorter {
    static sort(nodes, options) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        
        const getDependencies = options.getDependencies;
        const hasNode = options.hasNode;
        const onMissingDependency = options.onMissingDependency || (() => {});
        const errorMessagePrefix = options.errorMessagePrefix || "Circular dependency detected: ";

        const visit = (id) => {
            if (!hasNode(id)) return;
            if (visiting.has(id)) throw new Error(`${errorMessagePrefix}${id}`);
            if (visited.has(id)) return;

            visiting.add(id);
            const deps = getDependencies(id);
            if (deps) {
                for (const dep of deps) {
                    if (!hasNode(dep)) {
                        onMissingDependency(id, dep);
                        continue;
                    }
                    visit(dep);
                }
            }
            visiting.delete(id);
            visited.add(id);
            sorted.push(id);
        };

        for (const id of nodes) {
            if (!visited.has(id)) visit(id);
        }
        return sorted;
    }
}
```

The `PluginManager` and `Kernel` query the sorter dynamically:
```javascript
_resolveDependencies() {
    return DependencySorter.sort(Array.from(this._plugins.keys()), {
        getDependencies: (id) => this._plugins.get(id)?.manifest?.dependencies || [],
        hasNode: (id) => this._plugins.has(id),
        onMissingDependency: (id, dep) => {
            console.warn(`[PluginManager] WARNING: '${id}' requires missing module '${dep}'. Expect crashes.`);
        },
        errorMessagePrefix: "CIRCULAR DEPENDENCY DETECTED: "
    });
}
```

⚡︎ Why this is a first: Without topological sorting, your loading system is just a file list. AethelLib is the first to bring graph theory to Bedrock, ensuring that if Plugin B requires Plugin A, the system mathematically guarantees A is fully compiled and loaded before B attempts to initialize.
☨ PROCESS LIFECYCLE MANAGEMENT (onEnable / onDisable)

Traditional script frameworks execute code globally the moment the file is imported. Once loaded, the code is bound to the engine's memory pool forever, with no mechanism for clean shutdown or resource release.

AethelLib introduces a Stateful Lifecycle Machine. Plugins do not run top-level code; they register entry points and await formal execution signals from the Kernel's LifecycleController:
javascript

export const main = {
    async onEnable(context) {
        // Called only AFTER the dependency graph is fully resolved
        this.ledger = new SecureLedger();
        
        // Context-registered scheduling (automatically tracked by the Kernel)
        context.setInterval(() => {
            this.ledger.flush();
        }, 20);
    },
    
    async onDisable(context) {
        // Formal de-allocation phase
        // Clean up database handles, close connections, flush state
    }
};

⚡︎ Why this is a first: Without formal lifecycle hooks, hot reloading is impossible. When you re-import standard scripts, old event listeners remain bound in the engine's memory, creating duplicate handlers on every reload. AethelLib is the first runtime to make hot-reloading safe, allowing plugins to boot, shut down, and reload without leaking resources.
❖ THE MEMORY SHIELD (Active Resource Tracking)

Bedrock Dedicated Servers run on custom JavaScript environments (QuickJS/V8) where memory management is highly volatile. If a script registers a repeating timer (system.runInterval) or an event listener and is then unloaded, those tasks remain in the engine's microtask queue, spawning phantom operations that slowly bleed the server's TPS to death.

AethelLib implements a Preemptive Resource Registry. The context object provided to your plugin is a proxy that tracks every resource allocation:
javascript

const pluginState = {
    id: manifest.id,
    activeIntervals: [], // Track repeating ticks
    activeListeners: [], // Track event subscriptions
    activeCommands: []   // Track registered commands
};

const context = {
    setInterval: (callback, ticks) => {
        const id = TickScheduler.schedule(callback, ticks);
        pluginState.activeIntervals.push(id); // Logged in the tracking register
        return id;
    }
};

When a plugin is unloaded, the Kernel retrieves the tracking record and forcefully decommissions every registered resource:
javascript

// Safe de-allocation sequence
pluginState.activeIntervals.forEach(id => TickScheduler.cancel(id));
pluginState.activeListeners.forEach(unsubscribe => unsubscribe());
pluginState.activeCommands.forEach(cmd => CommandRegistry.unregister(cmd));

⚡︎ Why this is a first: AethelLib is the first system to implement proactive garbage collection for script allocations, shielding the dedicated server process from developer-induced memory leaks.
☭ THE SERVICE DISCOVERY MESH (exportAPI / requireAPI)

In traditional script structures, if Plugin A wants to access a function in Plugin B, it performs a hard disk-path import: import { getBalance } from "../Economy/main.js".

This is tight coupling. If folders are reorganized, or if a compilation error occurs in Economy, the entire import tree collapses like dominoes, bricking the server's boot sequence.

AethelLib introduces a Late-Binding Service Discovery Mesh:
javascript

// --- Inside Plugin A (Economy) ---
context.exportAPI({
    getBalance: (player) => { ... },
    addMoney: (player, amount) => { ... }
});

// --- Inside Plugin B (Shop) ---
// Late-bound import from the central Kernel mesh, NOT the disk path
const economy = context.requireAPI("aethel:core_economy");
const balance = economy.getBalance(player); // Guaranteed safe

⚡︎ Why this is a first: This completely decouples plugins from the physical file system. If a dependency is missing, AethelLib throws a clean, caught exception and bypasses that specific module, rather than letting a raw JavaScript compilation error crash the entire boot cycle.
⚔︎ THE COLD TRUTH

AethelLib is not the first addon to use the word "plugin."

AethelLib is the first addon to earn the word "plugin."

Because plugins without isolation are just functions.
Plugins without lifecycles are just scripts.
Plugins without dependencies are just includes.
Problem	Traditional Approach	AethelLib Solution
Load order	Manual file ordering	Topological DFS sort
Circular dependencies	Silent hang/crash	Detection + hard error
Data isolation	Global namespace	plugin:${id}: prefix
Hot reload	Memory leak cascade	onEnable/onDisable lifecycle
Resource cleanup	"Hope it stops"	Active tracking registry
Inter-plugin comms	Hard disk-path imports	Late-bound service mesh

AethelLib built the runtime. Everyone else just built a folder.
