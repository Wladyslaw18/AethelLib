import { Kernel } from "../../core/Kernel.js"
import { SignalBus } from "../../core/signalbus/SignalBus.js"

/** @typedef {import("@minecraft/server").Player} Player */

/*
 * INDUSTRIAL_LIQUIDITY_REGISTRY
 * ----------------------------------------------------------------------------
 * The core persistence layer for the empire's financial engine. Orchestrates 
 * atomic mutations of entity liquidity buffers via the PlayerStore 
 * transaction pipeline.
 *
 * PHILOSOPHY: Financial integrity is non-negotiable. Every credit must 
 * be accounted for. Use the transaction-hooks to prevent race-conditions 
 * or buffer-desyncs.
 */
export const EconomyStore = {
    DEFAULT_BALANCE: 1000, // INDUSTRIAL_STARTING_BUFFER

    /* 
     * LIQUIDITY_QUERY_PROTOCOL
     * Fetches the balance from the PlayerStore. Defaults to the 
     * industrial-default if no record is found.
     */
    getBalance(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        
        const balance = PlayerStore.get(player, StoreKeys.money(player.id))
        return balance !== null ? balance : this.DEFAULT_BALANCE
    },

    /* 
     * BUFFER_CALIBRATION_PIPELINE
     * Performs an atomic 'set' operation. Dispatches a balanceChanged 
     * signal upon successful commit.
     */
    async setBalance(player, amount) {
        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        return await PlayerStore.transaction(player, async () => {
            const success = PlayerStore.set(player, StoreKeys.money(player.id), Math.floor(amount))
            if (success) {
                SignalBus.emit("economy:balanceChanged", { player, newBalance: Math.floor(amount) })
            }
            return success
        })
    },

    /* 
     * LIQUIDITY_INJECTION_PIPELINE
     * Increments the entity's buffer by a specific amount within an 
     * atomic transaction block.
     */
    async addMoney(player, amount) {
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        return await PlayerStore.transaction(player, async () => {
            const currentBalance = this.getBalance(player)
            const newBalance = Math.floor(currentBalance + amount)

            const success = PlayerStore.set(player, StoreKeys.money(player.id), newBalance)
            if (success) {
                SignalBus.emit("economy:balanceChanged", { player, newBalance })
            }
            return success
        })
    },

    /* 
     * LIQUIDITY_EXTRACTION_PIPELINE
     * Decrements the entity's buffer. Performs a pre-flight check for 
     * sufficient liquidity before committing.
     */
    async removeMoney(player, amount) {
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        return await PlayerStore.transaction(player, async () => {
            const currentBalance = this.getBalance(player)

            if (currentBalance < amount) {
                return false // INSUFFICIENT_LIQUIDITY
            }

            const newBalance = Math.floor(currentBalance - amount)
            const success = PlayerStore.set(player, StoreKeys.money(player.id), newBalance)
            if (success) {
                SignalBus.emit("economy:balanceChanged", { player, newBalance })
            }
            return success
        })
    },

    /* 
     * CROSS-BUFFER_TRANSFER_ORCHESTRATOR
     * Orchestrates a multi-entity transaction. Removes liquidity from the 
     * sender and injects it into the receiver. Implements a 
     * refund-on-failure protocol to ensure financial atomicity.
     */
    async transferMoney(sender, receiver, amount) {
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        if (sender.id === receiver.id) {
            return false // SELF_TRANSFER_DETECTED
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        return await PlayerStore.transaction(sender, async () => {
            const senderBalance = this.getBalance(sender)

            if (senderBalance < amount) {
                return false // SENDER_INSUFFICIENT_LIQUIDITY
            }

            const newSenderBalance = Math.floor(senderBalance - amount)
            const senderSuccess = await PlayerStore.set(sender, StoreKeys.money(sender.id), newSenderBalance)
            if (!senderSuccess) return false

            try {
                const receiverBalance = this.getBalance(receiver)
                const newReceiverBalance = Math.floor(receiverBalance + amount)
                const receiverSuccess = await PlayerStore.set(receiver, StoreKeys.money(receiver.id), newReceiverBalance)

                if (!receiverSuccess) {
                    // EMERGENCY_REFUND_PROTOCOL
                    await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                    return false
                }

                SignalBus.emit("economy:balanceChanged", { player: sender, newBalance: newSenderBalance })
                SignalBus.emit("economy:balanceChanged", { player: receiver, newBalance: newReceiverBalance })

                return true
            } catch (error) {
                // EMERGENCY_REFUND_PROTOCOL
                await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                return false
            }
        })
    },

    /* 
     * LIQUIDITY_SOLVENCY_PROBE
     */
    async hasEnough(player, amount) {
        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
            return false
        }

        const balance = this.getBalance(player)
        return balance >= amount
    },

    /* 
     * GLOBAL_BALANCE_MANIFEST_QUERY (STUB)
     */
    async getAllBalances() {
        return []
    }
}
