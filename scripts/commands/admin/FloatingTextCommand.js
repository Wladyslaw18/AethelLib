import { FloatingTextStore } from "../../systems/floatingtext/FloatingTextStore.js"
import { spawnFloatingText, removeFloatingText, clearAll } from "../../systems/floatingtext/FloatingTextService.js"

// ----------------------------------------------------------------------------
// | object: FloatingTextCommand                                              |
// | command definition for managing hologram/floating text displays.          |
// | interfaces with the FloatingTextStore and Service for lifecycle control.  |
// ----------------------------------------------------------------------------
export const FloatingTextCommand = {
    // internal name.
    name: "ft",
    // human-readable description.
    description: "Manage floating text displays",
    // syntax guide.
    usage: "/ae:ft <add/remove/clear> [text]",
    // required permission level (staff).
    permission: "essentials.admin.ft",
    // command category.
    category: "admin",
    // native parameter definitions for the command parser.
    parameters: [
        { name: "subcommand", type: "string", optional: false },
        { name: "word1",      type: "string", optional: true  },
        { name: "word2",      type: "string", optional: true  },
        { name: "word3",      type: "string", optional: true  },
        { name: "word4",      type: "string", optional: true  },
        { name: "word5",      type: "string", optional: true  }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the hologram orchestration vector. handles injection, eviction, and flush |
    // | operations for spatial text entities.                                    |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // resolve the sub-vector token.
        const sub = args[0]?.toLowerCase()
        
        if (!sub) {
            player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:ft <add|remove|clear> [text]");
            return
        }

        switch (sub) {
            case "add":
                // aggregate remaining args into the display string.
                const text = args.slice(1).join(" ")
                if (!text) {
                    player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:ft add <text>");
                    return
                }

                // step 1: construct the entry object.
                const entry = {
                    text,
                    x: Math.floor(player.location.x),
                    // spawn slightly above head level.
                    y: Math.floor(player.location.y) + 1,
                    z: Math.floor(player.location.z),
                    dimension: player.dimension.id
                }
                
                // step 2: commit to persistent storage.
                const id = FloatingTextStore.add(entry)
                if (id) {
                    // step 3: manifest the entity in the world.
                    spawnFloatingText(entry)
                    player.sendMessage(`\xA7a\xA7l» \xA7fFloating text added (ID: \xA7e${id}\xA7f).`);
                } else {
                    player.sendMessage("\xA7c\xA7l» \xA77Failed to add floating text.");
                }
                break
                
            case "remove":
                // identify the specific entity to purge.
                const removeId = args[1]
                if (!removeId) {
                    player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:ft remove <id>");
                    return
                }

                // step 1: purge from store.
                const success = FloatingTextStore.remove(removeId)
                if (success) {
                    // step 2: evict the entity from the world.
                    removeFloatingText(removeId)
                    player.sendMessage("\xA7a\xA7l» \xA7fFloating text removed.");
                } else {
                    player.sendMessage("\xA7c\xA7l» \xA77Failed to remove floating text.");
                }
                break
                
            case "clear":
                // step 1: wipe the entire database registry.
                const clearSuccess = FloatingTextStore.clear()
                if (clearSuccess) {
                    // step 2: flush all active text entities from the world.
                    clearAll()
                    player.sendMessage("\xA7a\xA7l» \xA7fAll floating texts cleared.");
                } else {
                    player.sendMessage("\xA7c\xA7l» \xA77Failed to clear floating texts.");
                }
                break
                
            default:
                player.sendMessage("\xA7c\xA7l» \xA77Usage: /ae:ft <add/remove/clear> [text]");
        }
    }
}
