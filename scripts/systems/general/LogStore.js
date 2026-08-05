import { Kernel } from "../../core/Kernel.js"

/**
 * LogStore — unified player activity logger
 * Categories: "command" (commands run), "msg" (private messages)
 * Uses the database for persistence with circular buffer limits.
 */
export const LogStore = {
    /**
     * Log a command execution
     * @param {string} playerId
     * @param {string} playerName
     * @param {string} command - command name (e.g. "tpa", "msg")
     * @param {string} args - full argument string
     * @param {string} source - "chat", "slash", "prefix", "test"
     */
    logCommand(playerId, playerName, command, args, source) {
        try {
            const db = Kernel.get("database")
            if (!db) return

            const key = `audit:cmd:${playerId}`
            let logs = db.get(key) || []
            logs.push({
                type: "command",
                command,
                args: args || "",
                source: source || "chat",
                playerName,
                timestamp: Date.now()
            })
            // keep last 200 entries per player
            if (logs.length > 200) logs = logs.slice(-200)
            db.set(key, logs)
        } catch (e) {
            console.warn(`[LogStore] logCommand failed: ${e}`)
        }
    },

    /**
     * Get all logs for a player, optionally filtered by category
     * @param {string} playerId
     * @param {string} [category] - "command", "msg", or undefined for all
     * @param {number} [limit=50]
     * @returns {Array} sorted by timestamp descending
     */
    getPlayerLogs(playerId, category, limit = 50) {
        const db = Kernel.get("database")
        if (!db) return []

        const logs = []

        // Get command logs
        if (!category || category === "command") {
            const cmdLogs = db.get(`audit:cmd:${playerId}`) || []
            logs.push(...cmdLogs)
        }

        // Get message logs — need to query conversation partners
        if (!category || category === "msg") {
            const convPartners = db.get(`audit:convs:${playerId}`) || []
            for (const partnerId of convPartners) {
                const pairId = [playerId, partnerId].sort().join("_")
                const msgs = db.get(`audit:msg:${pairId}`) || []
                // Filter messages involving this player as sender or receiver
                for (const msg of msgs) {
                    if (msg.senderId === playerId || msg.receiverId === playerId) {
                        logs.push({
                            type: "msg",
                            direction: msg.senderId === playerId ? "sent" : "received",
                            content: msg.content,
                            partner: msg.senderId === playerId ? msg.receiver : msg.sender,
                            partnerId: msg.senderId === playerId ? msg.receiverId : msg.senderId,
                            timestamp: msg.timestamp
                        })
                    }
                }
            }
        }

        // Sort by timestamp descending
        logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        return logs.slice(0, limit)
    },

    /**
     * Get summary of activity for a player
     * @param {string} playerId
     * @returns {Object} { commandCount, msgCount, lastSeen }
     */
    getPlayerSummary(playerId) {
        const db = Kernel.get("database")
        if (!db) return { commandCount: 0, msgCount: 0, lastSeen: null }

        const cmdLogs = db.get(`audit:cmd:${playerId}`) || []
        const convPartners = db.get(`audit:convs:${playerId}`) || []

        let msgCount = 0
        for (const partnerId of convPartners) {
            const pairId = [playerId, partnerId].sort().join("_")
            const msgs = db.get(`audit:msg:${pairId}`) || []
            msgCount += msgs.filter(m => m.senderId === playerId || m.receiverId === playerId).length
        }

        const allTimestamps = [...cmdLogs.map(l => l.timestamp)]
        const lastSeen = allTimestamps.length > 0 ? Math.max(...allTimestamps) : null

        return {
            commandCount: cmdLogs.length,
            msgCount,
            lastSeen
        }
    }
}
