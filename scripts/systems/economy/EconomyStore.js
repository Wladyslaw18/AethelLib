import { Kernel } from "../../core/Kernel.js"
import { SignalBus } from "../../core/signalbus/SignalBus.js"
import { Configuration } from "../../Configuration.js"

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

function resolvePlayer(player) {
    if (!player) return null
    if (typeof player === "string") {
        const online = Kernel.world.getAllPlayers().find(p => p.id === player)
        if (online) return online
        return { id: player }
    }
    if (typeof player === "object") {
        if (player.id && !player.isValid) {
            const online = Kernel.world.getAllPlayers().find(p => p.id === player.id)
            if (online) return online
        }
        return player
    }
    return player
}

export const EconomyStore = {
    // how much cash a new player gets. enough for a sandwich.
    get DEFAULT_BALANCE() {
        return Number(Configuration.STARTING_BALANCE)
    }, 

    // ----------------------------------------------------------------------------
    // | getBalance                                                               |
    // | fetches a player's current credit balance.                               |
    // ----------------------------------------------------------------------------
    getBalance(player) {
        player = resolvePlayer(player)
        if (!player || !player.id) return this.DEFAULT_BALANCE

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
        player = resolvePlayer(player)
        if (!player || !player.id) return false

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
        player = resolvePlayer(player)
        if (!player || !player.id) return false

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
        player = resolvePlayer(player)
        if (!player || !player.id) return false

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
        sender = resolvePlayer(sender)
        receiver = resolvePlayer(receiver)
        if (!sender || !sender.id || !receiver || !receiver.id) return false

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
        const Database = Kernel.get("database")

        const senderBalance = this.getBalance(sender)
        const receiverBalance = this.getBalance(receiver)

        // check if sender can actually afford this.
        if (senderBalance < amount) {
            return false 
        }

        // ✦ Prevent deadlocks by locking sender and receiver in alphabetical order of player IDs
        const first = sender.id < receiver.id ? sender : receiver
        const second = sender.id < receiver.id ? receiver : sender

        // Write WAL entry immediately to persist the intent before transaction begins
        if (Database) {
            Database.writeWal(sender.id, receiver.id, amount, senderBalance, receiverBalance)
        }

        return await PlayerStore.transaction(first, async () => {
            return await PlayerStore.transaction(second, async () => {
                // subtract from sender.
                const newSenderBalance = Math.floor(senderBalance - amount)
                const senderSuccess = await PlayerStore.set(sender, StoreKeys.money(sender.id), newSenderBalance)
                if (!senderSuccess) {
                    if (Database) {
                        Database.flushDirty()
                        Database.clearWal()
                    }
                    return false
                }

                try {
                    // add to receiver.
                    const receiverSuccess = await PlayerStore.set(receiver, StoreKeys.money(receiver.id), Math.floor(receiverBalance + amount))

                    // if the receiver write fails, we MUST give the sender their money back.
                    if (!receiverSuccess) {
                        // EMERGENCY_REFUND_PROTOCOL
                        await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                        if (Database) {
                            Database.flushDirty()
                            Database.clearWal()
                        }
                        return false
                    }

                    // emit signals for both players.
                    SignalBus.emit("economy:balanceChanged", { player: sender, newBalance: newSenderBalance })
                    SignalBus.emit("economy:balanceChanged", { player: receiver, newBalance: Math.floor(receiverBalance + amount) })

                    if (Database) {
                        Database.flushDirty()
                        Database.clearWal()
                    }
                    return true
                } catch (error) {
                    // catch any crash during receiver update and refund the sender.
                    await PlayerStore.set(sender, StoreKeys.money(sender.id), Math.floor(senderBalance))
                    if (Database) {
                        Database.flushDirty()
                        Database.clearWal()
                    }
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
        player = resolvePlayer(player)
        if (!player || !player.id) return false

        if (typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
            return false
        }

        const balance = this.getBalance(player)
        return balance >= amount
    },

    // returns all player balances for leaderboard queries
    getAllBalances() {
        const Database = Kernel.get("database")
        if (!Database) return []
        const uuids = Database.get("ae:player_index") || []
        const balances = []
        for (const uuid of uuids) {
            const name = Database.get(`player:${uuid}:name`) || `ID:${uuid.slice(0, 5)}`
            const balance = Database.get(`player:${uuid}:money`) ?? this.DEFAULT_BALANCE
            balances.push({ name, balance })
        }
        return balances
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
