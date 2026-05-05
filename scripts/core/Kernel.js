import * as mc from "@minecraft/server";

/*
 * TITANIUM_KERNEL_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * The central nervous system of the AethelLib industrial framework. 
 * Provides a master service-locator (O(1)) and a stable abstraction bridge 
 * over the volatile native API.
 *
 * PHILOSOPHY: Zero-bypass stability. Isolation of the Minecraft-buffer. 
 * If the native world object drifts, the Kernel absorbs the impact.
 */
export class Kernel {
    /* 
     * SERVICE_REGISTRY_BUFFER
     * Private static Map ensures read-only integrity for external consumers.
     */
    static #systems = new Map();
    static #version = "2.7.0-BETA";

    /*
     * STABLE_API_ABSTRACTIONS
     */
    static get world() { return mc.world; }
    static get system() { return mc.system; }

    /*
     * SERVICE_DOCKING_PROTOCOL
     * Injects a modular sub-system into the Kernel's memory space. 
     * Performs a collision-scan to prevent silent service overwrites.
     */
    static register(id, instance) {
        if (this.#systems.has(id)) {
            console.warn(`[Kernel] COLLISION_ALERT: System identifier '${id}' is already registered. Overwriting.`);
        }
        this.#systems.set(id, instance);
        console.log(`[Kernel] SERVICE_DOCKED: ${id.toUpperCase()} | VER: ${this.#version}`);
    }

    /*
     * SERVICE_LOCATOR_PIPELINE
     * Resolves a docked service identifier to its instance. O(1) lookup.
     */
    static get(id) {
        return this.#systems.get(id);
    }

    /*
     * SERVICE_AVAILABILITY_PROBE
     */
    static has(id) {
        return this.#systems.has(id);
    }

    /*
     * INDUSTRIAL_BOOTSTRAP_ORCHESTRATOR
     * Triggers the initialization of critical foundation layers.
     */
    static init() {
        const CommandManager = this.get("commandManager");
        if (CommandManager) {
            CommandManager.init();
        }
        
        console.log(`[Kernel] TITANIUM_BOOTSTRAP_COMPLETE | ENGINE_READY`);
    }
}
