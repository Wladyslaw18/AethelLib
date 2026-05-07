import * as mc from "@minecraft/server";
import * as mcui from "@minecraft/server-ui";

/**
 * Central kernel that manages services and proxies native Minecraft APIs.
 * This keeps the rest of the codebase stable if the native API changes.
 */
export class Kernel {
    // Stores registered system instances
    static #systems = new Map();
    // Stores registered external plugins
    static #plugins = new Map();

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
        console.log("[Kernel] Service registered. Total services: " + Kernel.size);
    }

    /**
     * Register an external plugin or sub-mod
     * @param {Object} manifest - { name, version }
     * @param {Function} onInit - Callback for initialization logic
     */
    static registerPlugin(manifest, onInit) {
        this.#plugins.set(manifest.name, { manifest, onInit });
        console.log(`[Kernel] Plugin registered: ${manifest.name} v${manifest.version}`);
    }

    /**
     * Get a registered service by its ID
     */
    static get(id) {
        return this.#systems.get(id);
    }

    /**
     * Check if a service is registered
     */
    static has(id) {
        return this.#systems.has(id);
    }

    /**
     * Initialize all registered plugins
     * This must be called when the world state is stable (not early execution).
     */
    static bootPlugins() {
        for (const [name, plugin] of this.#plugins) {
            try {
                plugin.onInit(this);
            } catch (error) {
                console.error(`[Kernel] Plugin '${name}' failed to initialize:`, error);
            }
        }
        
        console.log(`[Kernel] Plugins initialized: ${this.#plugins.size}`);
    }
}



/**
 * Type definitions for core services
 * @typedef {Object} ServiceRegistry
 * @property {import("./permissions/PermissionManager").PermissionManager} permissions
 * @property {import("../systems/social/MuteStore").MuteStore} muteStore
 * @property {import("./datastore/DatabaseManager").DatabaseManager} database
 * @property {import("./signalbus/SignalBus").SignalBus} signalBus
 * @property {import("./store/PlayerStore").PlayerStore} playerStore
 * @property {import("./store/WorldStore").WorldStore} worldStore
 * @property {import("../systems/social/chat/ChatSystem").ChatSystem} chat
 * @property {import("./commands/CommandManager").CommandManager} commandManager
 * @property {import("../commands/base/CommandRegistry").CommandRegistry} commandRegistry
 * @property {import("../systems/teleport/HomeStore").HomeStore} homeStore
 * @property {import("../systems/teleport/WarpStore").WarpStore} warpStore
 * @property {import("../systems/tpa/TpaStore").TPAStore} tpaStore
 * @property {import("../systems/teleport/TeleportService").TeleportService} teleportService
 */



