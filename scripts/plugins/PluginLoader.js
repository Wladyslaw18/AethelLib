/**
 * Aethelgrad Plugin Loader
 * ----------------------------------------------------------------------------
 * This file orchestrates the loading of external vectors.
 * Using dynamic imports to ensure one faulty plugin doesn't prevent 
 * the core system from booting.
 */

import { PluginManager } from "../core/plugins/PluginManager.js";

const PLUGINS = [
    { path: "./ExamplePlugin/ExampleLoader.js", loader: () => import("./ExamplePlugin/ExampleLoader.js") }
];

export async function loadPlugins() {
    await PluginManager.loadAll(PLUGINS);
}

console.log("[AethelLib] Plugin Loader initialized.");
