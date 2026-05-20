import { Kernel } from "../../core/Kernel.js"
import { SignalBus } from "../../core/signalbus/SignalBus.js"

/*
 * INDUSTRIAL_SCOREBOARD_MIRROR
 * ----------------------------------------------------------------------------
 * A high-performance synchronization bridge that mirrors the internal 
 * industrial economy-buffer into the native Minecraft scoreboard registry. 
 * Orchestrates real-time visual updates for entity-liquidity status.
 *
 * PHILOSOPHY: Legacy interfaces must be supported for visual parity. 
 * Subscribe to the balanceChanged signal to ensure zero-lag synchronization.
 */

const OBJECTIVE_ID = "money"
const DISPLAY_NAME = "\u00A76LIQUIDITY"

/* 
 * SYSTEM_BOOTSTRAP_PROTOCOL
 */
export function init() {
    ensureObjective()

    /* 
     * SIGNAL_INTERCEPTION_VECTOR
     * Listens for the balanceChanged signal and orchestrates the O(1) 
     * scoreboard mutation.
     */
    SignalBus.on("economy:balanceChanged", ({ player, newBalance }) => {
        if (!player?.isValid) return
        try {
            const objective = Kernel.world.scoreboard.getObjective(OBJECTIVE_ID)
            if (objective) {
                const clamped = Math.max(-2147483648, Math.min(2147483647, Math.floor(newBalance)))
                // @ts-ignore
                objective.setScore(player, clamped)
            }
        } catch (error) {
            console.error(`[ScoreboardMirror] SYNC_FAILURE: ${error}`)
        }
    })

    /* 
     * INITIALIZATION_SYNC_VECTOR
     * Synchronizes the entity's score upon successful session-initialization.
     */
    Kernel.world.afterEvents.playerSpawn.subscribe((event) => {
        if (!event.initialSpawn) return
        const player = event.player

        Kernel.system.runTimeout(() => {
            if (!player.isValid) return
            try {
                const EconomyStore = Kernel.get("economy")
                const balance = EconomyStore.getBalance(player)
                const objective = Kernel.world.scoreboard.getObjective(OBJECTIVE_ID)
                if (objective) {
                    const clamped = Math.max(-2147483648, Math.min(2147483647, Math.floor(balance)))
                    // @ts-ignore
                    objective.setScore(player, clamped)
                }
            } catch (error) {
                console.error(`[ScoreboardMirror] INITIAL_SYNC_FAILURE: ${error}`)
            }
        }, 20) 
    })

    console.log(`[ScoreboardMirror] BRIDGE_ACTIVE: Syncing manifest to objective '${OBJECTIVE_ID}'`);
}

/* 
 * OBJECTIVE_VERIFICATION_PROTOCOL
 * Ensures the target scoreboard node exists in the native registry.
 */
function ensureObjective() {
    try {
        const existing = Kernel.world.scoreboard.getObjective(OBJECTIVE_ID)
        if (!existing) {
            Kernel.world.scoreboard.addObjective(OBJECTIVE_ID, DISPLAY_NAME)
        }
    } catch (error) {
        console.error(`[ScoreboardMirror] OBJECTIVE_PROBE_FAILURE: ${error}`)
    }
}
