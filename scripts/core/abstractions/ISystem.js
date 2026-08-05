/*
 * ISYSTEM_LIFECYCLE_CONTRACT
 * ----------------------------------------------------------------------------
 * This interface defines the mandatory lifecycle methods for any module 
 * registered with the Titanium Kernel. We enforce a standardized 
 * init/update/shutdown flow to ensure that the engine can orchestrate 
 * system states deterministically.
 *
 * PHILOSOPHY: Systems must be able to initialize their state, process 
 * tick-based logic, and clean up their buffers during a shutdown event.
 */

class ISystem {
    /**
     * Triggered during core bootstrap phases.
     * 
     * EXPECTS:
     * - config: Config options manifest or SystemConfig.
     * 
     * GUARANTEES:
     * - Initializes internal system states and registers dependencies.
     * 
     * @param {import("../../../types").SystemConfig} config - Config parameters.
     */
    async initialize(config) {
        void config;
        throw new Error("[ContractViolation] 'initialize' method must be implemented.");
    }

    /**
     * Ticked by system schedulers to execute updates.
     * 
     * EXPECTS:
     * - tick: Current engine tick count integer.
     * 
     * GUARANTEES:
     * - Runs hot-path logic within performance parameters.
     * 
     * @param {number} tick - Current tick.
     */
    async update(tick) {
        void tick;
        throw new Error("[ContractViolation] 'update' method must be implemented.");
    }

    /**
     * Shuts down internal states and cleans listeners.
     * 
     * EXPECTS:
     * - None.
     * 
     * GUARANTEES:
     * - Deallocates memory allocations, tick schedulers, and unsubscribes event handlers.
     */
    async shutdown() {
        throw new Error("[ContractViolation] 'shutdown' method must be implemented.");
    }

    /**
     * Fetches current data cache audit copy.
     * 
     * GUARANTEES:
     * - Returns read-only snapshot object of internal system state.
     */
    get data() {
        throw new Error("[ContractViolation] 'data' getter must be implemented.");
    }
}

export { ISystem };
