import { PluginManager } from "../core/plugins/PluginManager.js";

// master module manifest.
// yes, it's hardcoded. no, we can't use fs.readdir in bedrock. deal with it.
const PLUGINS = [
    { path: "CoreEconomy", loader: () => import("./CoreEconomy/index.js") },
    { path: "BountyHunter", loader: () => import("./BountyHunter/index.js") },
    { path: "Clans", loader: () => import("./Clans/index.js") }
];

export async function loadPlugins() {
    await PluginManager.loadAll(PLUGINS);
}
