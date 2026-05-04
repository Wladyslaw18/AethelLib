import * as mc from "@minecraft/server";

/**
 * Titanium Kernel 🛡️💎
 * Stable API Bridge & System Registry
 * "Anti-Pao Principles" - Zero Backdoor, High Stability.
 */
export class Kernel {
    static #systems = new Map();
    static #version = "1.0.0";

    // --- STABLE API BRIDGE ---
    // If Minecraft changes these, we only fix them HERE.
    static get world() { return mc.world; }
    static get system() { return mc.system; }

    /**
     * Register a modular system into the Kernel.
     * @param {string} id - Unique identifier for the system.
     * @param {any} instance - The system instance/object.
     */
    static register(id, instance) {
        if (this.#systems.has(id)) {
            console.warn(`[Kernel] System already registered: ${id}. Overwriting...`);
        }
        this.#systems.set(id, instance);
        console.log(`§b[Kernel] System Registered: §f${id} §7(v${this.#version})`);
    }

    /**
     * Retrieve a registered system.
     * @param {string} id - The unique identifier.
     * @returns {any} The system instance or undefined.
     */
    static get(id) {
        return this.#systems.get(id);
    }

    /**
     * Check if a system is registered.
     * @param {string} id 
     * @returns {boolean}
     */
    static has(id) {
        return this.#systems.has(id);
    }
}

