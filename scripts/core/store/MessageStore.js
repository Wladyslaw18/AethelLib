import { Kernel } from "../Kernel.js"

// ----------------------------------------------------------------------------
// | class: MessageStore                                                      |
// | INDUSTRIAL_COMMUNICATION_ARCHIVE                                         |
// | Persists P2P packets for administrative audit.                           |
// | Uses sharded vectors to prevent registry overflow.                       |
// | Implements debounced flushing to prevent TPS death on heavy chat load.   |
// ----------------------------------------------------------------------------
export class MessageStore {
    // memory buffer to hold messages before writing to the physical database.
    static #buffer = new Map()
    static #initialized = false

    // ----------------------------------------------------------------------------
    // | method: init                                                             |
    // | starts the debounced flush cycle. runs every 5 seconds.                  |
    // ----------------------------------------------------------------------------
    static init() {
        if (this.#initialized) return
        this.#initialized = true

        // flush every 5 seconds (100 ticks at 20tps)
        Kernel.system.runInterval(() => {
            this.flush()
        }, 100)
    }

    // ----------------------------------------------------------------------------
    // | method: logPrivateMessage                                                |
    // | pushes a new evidence packet to the memory buffer.                       |
    // ----------------------------------------------------------------------------
    static logPrivateMessage(packet) {
        if (!this.#initialized) this.init()

        const pairId = [packet.senderId, packet.receiverId].sort().join("_")
        
        if (!this.#buffer.has(pairId)) {
            this.#buffer.set(pairId, [])
        }
        
        this.#buffer.get(pairId).push(packet)
    }

    // ----------------------------------------------------------------------------
    // | method: flush                                                            |
    // | commits the buffered evidence to the physical shard store.               |
    // ----------------------------------------------------------------------------
    static flush() {
        if (this.#buffer.size === 0) return

        const db = Kernel.get("database")
        if (!db) return
        
        for (const [pairId, newLogs] of this.#buffer.entries()) {
            const logKey = `audit:msg:${pairId}`
            
            // get existing logs for this pair from the physical db.
            let existingLogs = db.get(logKey) || []
            
            // push the new evidence.
            existingLogs.push(...newLogs)

            // CIRCULAR_BUFFER_LIMIT: keep only the last 500 messages.
            if (existingLogs.length > 500) {
                existingLogs = existingLogs.slice(-500)
            }

            // commit to the sharded DB (Władysław's sharding saves the day here!).
            db.set(logKey, existingLogs)

            // Maintain O(1) conversation partner indexes for both players
            const parts = pairId.split("_")
            if (parts.length === 2) {
                const [idA, idB] = parts
                
                const convsA = db.get(`audit:convs:${idA}`) || []
                if (!convsA.includes(idB)) {
                    convsA.push(idB)
                    db.set(`audit:convs:${idA}`, convsA)
                }
                
                const convsB = db.get(`audit:convs:${idB}`) || []
                if (!convsB.includes(idA)) {
                    convsB.push(idA)
                    db.set(`audit:convs:${idB}`, convsB)
                }
            }
        }

        // clear the buffer for the next cycle.
        this.#buffer.clear()
    }
}
