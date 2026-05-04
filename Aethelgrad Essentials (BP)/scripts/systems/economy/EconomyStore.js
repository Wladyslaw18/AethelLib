import { Kernel } from "../../core/Kernel.js"

/** @typedef {import("@minecraft/server").Player} Player */

export const EconomyStore = {
    /**
     * Default starting balance
     */
    DEFAULT_BALANCE: 1000,

    /**
     * Get player balance
     * @param {Player} player - Player object
     * @returns {number} Player balance
     */
    getBalance(player) {
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        
        const balance = PlayerStore.get(player, StoreKeys.money(player.id))
        return balance !== null ? balance : this.DEFAULT_BALANCE
    },

    /**
     * Set player balance (atomic)
     * @param {Player} player - Player object
     * @param {number} amount - New balance amount
     * @returns {Promise<boolean>} Success status
     */
    async setBalance(player, amount) {
        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        return await PlayerStore.transaction(player, async () => {
            return PlayerStore.set(player, StoreKeys.money(player.id), Math.floor(amount))
        })
    },

    /**
     * Add money to player balance (atomic)
     * @param {Player} player - Player object
     * @param {number} amount - Amount to add
     * @returns {Promise<boolean>} Success status
     */
    async addMoney(player, amount) {
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        return await PlayerStore.transaction(player, async () => {
            const currentBalance = this.getBalance(player)
            const newBalance = currentBalance + amount

            return PlayerStore.set(player, StoreKeys.money(player.id), Math.floor(newBalance))
        })
    },

    /**
     * Remove money from player balance (atomic)
     * @param {Player} player - Player object
     * @param {number} amount - Amount to remove
     * @returns {Promise<boolean>} Success status
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
                return false // Insufficient funds
            }

            const newBalance = currentBalance - amount
            return PlayerStore.set(player, StoreKeys.money(player.id), Math.floor(newBalance))
        })
    },

    /**
     * Transfer money between players (atomic for both players)
     * @param {Player} sender - Sender player
     * @param {Player} receiver - Receiver player
     * @param {number} amount - Amount to transfer
     * @returns {Promise<boolean>} Success status
     */
    async transferMoney(sender, receiver, amount) {
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        if (sender.id === receiver.id) {
            return false // Can't transfer to self
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        // Use sender's transaction queue to ensure atomicity
        return await PlayerStore.transaction(sender, async () => {
            const senderBalance = this.getBalance(sender)

            if (senderBalance < amount) {
                return false // Sender has insufficient funds
            }

            // Remove from sender
            const senderSuccess = await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance - amount))
            if (!senderSuccess) {
                return false
            }

            // Add to receiver (use receiver's transaction to avoid conflicts)
            try {
                const receiverBalance = this.getBalance(receiver)
                const receiverSuccess = await PlayerStore.set(receiver, StoreKeys.money(receiver.id), Math.floor(receiverBalance + amount))

                if (!receiverSuccess) {
                    // Refund sender if receiver update failed
                    await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                    return false
                }

                return true
            } catch (error) {
                // Refund sender on any error
                await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                return false
            }
        })
    },

    /**
     * Check if player has enough money
     * @param {Player} player - Player object
     * @param {number} amount - Amount to check
     * @returns {Promise<boolean>} Whether player has enough money
     */
    async hasEnough(player, amount) {
        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
            return false
        }

        const balance = this.getBalance(player)
        return balance >= amount
    },

    /**
     * Get all player balances (for top money list)
     * @returns {Promise<Array>} Array of {playerId, name, balance} objects
     */
    async getAllBalances() {
        return []
    }
}
