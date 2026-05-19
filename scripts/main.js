import { Kernel } from "./core/Kernel.js"
import { init as initEarly } from "./bootstrap/early.js"
import { init as initCore } from "./bootstrap/core.js"
import { init as initCommands } from "./bootstrap/commands.js"
import { loadPlugins } from "./plugins/PluginLoader.js"

// ----------------------------------------------------------------------------
// | entry point: main.js                                                     |
// | the first file executed by the bedrock script engine.                    |
// | coordinates the initialization sequence for the entire library.          |
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// | synchronous initialization (stage 0)                                     |
// | these run immediately before the first tick.                             |
// | used to set up global variables and register command definitions.        |
// ----------------------------------------------------------------------------

// stage 0.1: register basic registries (services, events).
initEarly()
// stage 0.2: register command definitions so the autocomplete works.
initCommands()

// ----------------------------------------------------------------------------
// | asynchronous boot sequence                                               |
// | runs inside a Kernel.system.run loop to ensure we have access to the world      |
// | and other engine features that aren't ready at instant-zero.             |
// ----------------------------------------------------------------------------
Kernel.system.run(async () => {
    // stage 1: core boot.
    // initializes managers (database, cache, etc) and sets up event listeners.
    initCore()

    // stage 2: plugins.
    // scans the plugin directory and imports each module.
    // this is async because it uses dynamic imports.
    await loadPlugins()

    // stage 3: finalize.
    // trigger the 'onBoot' function for every loaded plugin.
    Kernel.bootPlugins()

    // and we're done. hopefully nothing crashed.
    console.log("[AethelLib] systems active.");
})
