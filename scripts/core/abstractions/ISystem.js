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
    /* 
     * SYSTEM_BOOTSTRAP_VECTOR
     * ----------------------------------------------------------------------------
     * Triggered during the Kernel.init() phase. This is where the system 
     * handshakes with its dependencies and loads its initial state.
     */
    async initialize(config) {
        void config
        throw new Error("[ContractViolation] 'initialize' method must be implemented.");
    }

    /* 
     * TICK_ORCHESTRATION_LOOP
     * ----------------------------------------------------------------------------
     * Called every tick by the Master Scheduler. This is where the hot-path 
     * logic resides. If your update method exceeds 5ms, I will personally 
     * refactor your soul.
     */
    async update(tick) {
        void tick
        throw new Error("[ContractViolation] 'update' method must be implemented.");
    }

    /* 
     * GRACEFUL_TERMINATION_PROTOCOL
     * ----------------------------------------------------------------------------
     * Triggered during server shutdown or hot-reload. This is where you 
     * flush buffers and unsubscribe from event buses to prevent memory 
     * leaks.
     */
    async shutdown() {
        throw new Error("[ContractViolation] 'shutdown' method must be implemented.");
    }

    /* 
     * DATA_STATE_ACCESSOR
     * Returns the internal state-buffer of the system for auditing purposes.
     */
    get data() {
        throw new Error("[ContractViolation] 'data' getter must be implemented.");
    }
}

export { ISystem }
