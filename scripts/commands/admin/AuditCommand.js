import { Kernel } from "../../core/Kernel.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

// ----------------------------------------------------------------------------
// | object: AuditCommand                                                     |
// | opens the forbidden texts. pulls up the industrial communication archive |
// | for administrative review.                                               |
// ----------------------------------------------------------------------------
export const AuditCommand = {
    // internal name.
    name: "audit",
    // human-readable description.
    description: "Read the P2P communication archive for a player.",
    // syntax guide.
    usage: "/ae:audit <playerName>",
    // required permission node.
    permission: "essentials.admin.audit",
    // command category.
    category: "Admin",
    // native parameter definitions.
    parameters: [
        { name: "player", type: "string", optional: false } // we use string because they might be offline
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | scans the registry for any sharded conversation vectors involving the    |
    // | target and prints them for review.                                       |
    // ----------------------------------------------------------------------------
    async execute(_data, admin, args) {
        if (!args[0]) {
            return admin.sendMessage("\u00A7c\u00A7l» \u00A77Usage: /ae:audit <playerName>")
        }

        // try to find the player by name (can be offline, but PlayerUtils might only do online. let's check).
        const target = PlayerUtils.findPlayer(args[0])
        // fallback to trying to find the ID if they provided an exact name or ID that we can resolve.
        // wait, we need their ID to scan the database.
        const targetId = target ? target.id : PlayerUtils.getIdByName(args[0])
        const targetName = target ? target.name : args[0]

        if (!targetId) {
            return admin.sendMessage("\u00A7c\u00A7l» \u00A77Target not found in active buffer.")
        }

        const db = Kernel.get("database")
        if (!db) return admin.sendMessage("\u00A7c\u00A7l» \u00A77Database core offline.")

        // force a flush of the message store so we get the most recent messages.
        const MessageStore = Kernel.get("messageStore")
        if (MessageStore) MessageStore.flush()

        // this is the heavy part: finding all keys where this player exists.
        // we pull all keys and filter for 'audit:msg:' containing the target id.
        const allIds = Kernel.world.getDynamicPropertyIds()
        const relevantKeys = allIds.filter(id => id.startsWith("audit:msg:") && id.includes(targetId))

        if (relevantKeys.length === 0) {
            return admin.sendMessage(`\u00A76\u00A7l» \u00A77No communication records found for ${targetName}.`)
        }

        admin.sendMessage(`\u00A76\u00A7l--- AUDIT LOG: ${targetName} ---`)

        // compile all messages from all threads into a single chronological timeline.
        let masterTimeline = []

        for (const key of relevantKeys) {
            const logs = db.get(key)
            if (Array.isArray(logs)) {
                masterTimeline.push(...logs)
            }
        }

        // sort by timestamp.
        masterTimeline.sort((a, b) => a.timestamp - b.timestamp)

        // keep only the last 50 total messages to avoid chat spam for the admin.
        if (masterTimeline.length > 50) {
            masterTimeline = masterTimeline.slice(-50)
            admin.sendMessage(`\u00A78\u00A7o(Showing last 50 messages)`)
        }

        // print them out.
        for (const msg of masterTimeline) {
            const time = new Date(msg.timestamp).toLocaleTimeString()
            const direction = msg.senderId === targetId ? `\u00A7dTO \u00A7e${msg.receiver}` : `\u00A7dFROM \u00A7e${msg.sender}`
            admin.sendMessage(`\u00A78[${time}] ${direction}\u00A78: \u00A7f${msg.content}`)
        }

        admin.sendMessage(`\u00A76\u00A7l------------------------`)
    }
}
