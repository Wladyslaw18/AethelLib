import { Kernel } from "../../core/Kernel.js"
import { SignalBus } from "../../core/signalbus/SignalBus.js"

// ----------------------------------------------------------------------------
// | @typedef {import("@minecraft/server").Player} Player                     |
// | standard typescript-ish type definition so the ide doesn't complain.      |
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// | EconomyStore                                                              |
// | handles the server's money logic. atomic transactions, balance checks,    |
// | and leaderboard generation. keep your hands off the transaction chains.    |
// ----------------------------------------------------------------------------

// small cache to store the top 10 richest players so we don't scan the db every frame.
let cachedLeaderboard = []

export const EconomyStore = {
    // how much cash a new player gets. enough for a sandwich.
    DEFAULT_BALANCE: 1000, 

    // ----------------------------------------------------------------------------
    // | getBalance                                                               |
    // | fetches a player's current credit balance.                               |
    // ----------------------------------------------------------------------------
    getBalance(player) {
        // get the player store and keys utilities from the kernel.
        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")
        
        // try to get the money value using the player's unique id key.
        const balance = PlayerStore.get(player, StoreKeys.money(player.id))
        // if they don't have a record yet, give them the default starting amount.
        return balance !== null ? balance : this.DEFAULT_BALANCE
    },

    // ----------------------------------------------------------------------------
    // | setBalance                                                               |
    // | forces a player's balance to a specific value.                           |
    // | uses a transaction so we don't hit race conditions with other scripts.    |
    // ----------------------------------------------------------------------------
    async setBalance(player, amount) {
        // validation. don't allow negative numbers or weird infinity stuff.
        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        // wrap the write operation in an atomic transaction.
        return await PlayerStore.transaction(player, async () => {
            // save the floored value (no pennies allowed).
            const success = PlayerStore.set(player, StoreKeys.money(player.id), Math.floor(amount))
            if (success) {
                // tell the rest of the system (like the scoreboard) that money changed.
                SignalBus.emit("economy:balanceChanged", { player, newBalance: Math.floor(amount) })
            }
            return success
        })
    },

    // ----------------------------------------------------------------------------
    // | addMoney                                                                 |
    // | increments a player's balance.                                           |
    // ----------------------------------------------------------------------------
    async addMoney(player, amount) {
        // only allow positive additions.
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        // transaction ensures we don't 'add' to an old balance value.
        return await PlayerStore.transaction(player, async () => {
            // get the latest data inside the transaction block.
            const currentBalance = this.getBalance(player)
            const newBalance = Math.floor(currentBalance + amount)

            // write the new sum.
            const success = PlayerStore.set(player, StoreKeys.money(player.id), newBalance)
            if (success) {
                SignalBus.emit("economy:balanceChanged", { player, newBalance })
            }
            return success
        })
    },

    // ----------------------------------------------------------------------------
    // | removeMoney                                                              |
    // | decrements a player's balance. checks if they are broke first.           |
    // ----------------------------------------------------------------------------
    async removeMoney(player, amount) {
        // only allow positive subtractions.
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        return await PlayerStore.transaction(player, async () => {
            // get current balance inside the lock.
            const currentBalance = this.getBalance(player)

            // if they don't have enough, stop here.
            if (currentBalance < amount) {
                return false 
            }

            const newBalance = Math.floor(currentBalance - amount)
            const success = PlayerStore.set(player, StoreKeys.money(player.id), newBalance)
            if (success) {
                SignalBus.emit("economy:balanceChanged", { player, newBalance })
            }
            return success
        })
    },

    // ----------------------------------------------------------------------------
    // | transferMoney                                                            |
    // | moves money from one player to another.                                  |
    // | very complex because it requires locking TWO players at once.            |
    // | implements a manual rollback if the second write fails.                  |
    // ----------------------------------------------------------------------------
    async transferMoney(sender, receiver, amount) {
        // basic validation.
        if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
            return false
        }

        // don't let people pay themselves. that's just weird.
        if (sender.id === receiver.id) {
            return false 
        }

        const PlayerStore = Kernel.get("playerStore")
        const StoreKeys = Kernel.get("keys")

        // lock the sender first.
        return await PlayerStore.transaction(sender, async () => {
            // then lock the receiver. we now have a double lock.
            return await PlayerStore.transaction(receiver, async () => {
                const senderBalance = this.getBalance(sender)

                // check if sender can actually afford this.
                if (senderBalance < amount) {
                    return false 
                }

                // subtract from sender.
                const newSenderBalance = Math.floor(senderBalance - amount)
                const senderSuccess = await PlayerStore.set(sender, StoreKeys.money(sender.id), newSenderBalance)
                if (!senderSuccess) return false

                try {
                    // add to receiver.
                    const receiverBalance = this.getBalance(receiver)
                    const newReceiverBalance = Math.floor(receiverBalance + amount)
                    const receiverSuccess = await PlayerStore.set(receiver, StoreKeys.money(receiver.id), newReceiverBalance)

                    // if the receiver write fails, we MUST give the sender their money back.
                    if (!receiverSuccess) {
                        // EMERGENCY_REFUND_PROTOCOL
                        await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                        return false
                    }

                    // emit signals for both players.
                    SignalBus.emit("economy:balanceChanged", { player: sender, newBalance: newSenderBalance })
                    SignalBus.emit("economy:balanceChanged", { player: receiver, newBalance: newReceiverBalance })

                    return true
                } catch (error) {
                    // catch any crash during receiver update and refund the sender.
                    await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                    return false
                }
            })
        })
    },

    // ----------------------------------------------------------------------------
    // | hasEnough                                                                |
    // | quick check if a player can afford something.                            |
    // ----------------------------------------------------------------------------
    async hasEnough(player, amount) {
        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
            return false
        }

        const balance = this.getBalance(player)
        return balance >= amount
    },

    // returns the last generated leaderboard.
    getCachedLeaderboard() {
        return cachedLeaderboard
    },

    // ----------------------------------------------------------------------------
    // | updateLeaderboardGenerator                                               |
    // | a generator that slowly scans the entire database for money values.      |
    // | yields every 50 keys to prevent freezing the server.                     |
    // ----------------------------------------------------------------------------
    *updateLeaderboardGenerator() {
        const Database = Kernel.get("database")
        // get every single key in the world's dynamic property storage.
        const ids = Kernel.world.getDynamicPropertyIds()
        // looking for keys that look like 'player:<id>:money'.
        const moneyPattern = /^player:(.+):money$/
        const newLeaderboard = []
        
        // loop through thousands of keys.
        for (let i = 0; i < ids.length; i++) {
            // yield control back to the engine every 50 entries to keep tps high.
            if (i % 50 === 0) yield
            
            const match = ids[i].match(moneyPattern)
            if (match) {
                // extract the player id from the key.
                const playerId = match[1]
                const balance = Database.get(ids[i])
                // try to find their display name, otherwise use a slice of their id.
                const name = Database.get(`player:${playerId}:name`) || `ID:${playerId.slice(0, 5)}`
                
                if (typeof balance === 'number') {
                    newLeaderboard.push({ name, balance })
                }
            }
        }
        
        // sort by balance (descending).
        newLeaderboard.sort((a, b) => b.balance - a.balance)
        // take the top 10 and save them to the cache.
        cachedLeaderboard = newLeaderboard.slice(0, 10)
    }
}
