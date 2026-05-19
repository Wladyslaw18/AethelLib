import { Kernel } from "../../core/Kernel.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

// ----------------------------------------------------------------------------
// | object: MoneyCommand                                                     |
// | command definition for checking financial status.                         |
// | allows a player to see their own wallet or peek into others'.            |
// ----------------------------------------------------------------------------
export const MoneyCommand = {
    // internal name.
    name: "money",
    // human-readable description.
    description: "View your money or another player's balance",
    // syntax guide.
    usage: "/ae:money [entity_identifier]",
    // required permission level.
    permission: "essentials.money",
    // command category.
    category: "ECONOMY",
    // native parameter definitions.
    parameters: [
        { name: "target", type: "player", optional: true }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the liquidity query pipeline. handles self-checks, online checks,        |
    // | and slow database scans for offline entities.                            |
    // ----------------------------------------------------------------------------
    async execute(_data, player, args) {
        // the first argument is our target identifier.
        const targetName = args[0]
        
        // case 1: no argument. player wants to see their own money.
        if (!targetName) {
            // fetch from the economy store (which uses an O(1) memory cache).
            const balance = EconomyStore.getBalance(player)
            player.sendMessage(`\xA7a\xA7l» \xA7fYour balance: \xA7e$${balance.toLocaleString()}\xA7f.`);
            return
        }

        // case 2: check if the target is online.
        const targetPlayer = Kernel.world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        
        if (targetPlayer) {
            // fast path: pull from online cache.
            const balance = EconomyStore.getBalance(targetPlayer)
            player.sendMessage(`\xA7a\xA7l» \xA7f${targetPlayer.name}'s balance: \xA7e$${balance.toLocaleString()}\xA7f.`);
        } else {
            // case 3: target is offline. we have to do a slow database crawl.
            // this is expensive because dynamic properties aren't indexed.
            const Database = Kernel.get("database")
            // get every single property key in the Kernel.world (O(N) where N is property count).
            const ids = Kernel.world.getDynamicPropertyIds()
            // we are looking for the player's name mapping key.
            const namePattern = /^player:(.+):name$/
            let foundId = null
            let foundName = null

            // loop through everything until we find a name match.
            for (const id of ids) {
                const match = id.match(namePattern)
                if (match) {
                    const name = Database.get(id)
                    // check if this is the person we're looking for.
                    if (name && typeof name === "string" && name.toLowerCase() === targetName.toLowerCase()) {
                        foundId = match[1]
                        foundName = name
                        break
                    }
                }
            }

            // if we found a match in the cold storage.
            if (foundId) {
                // fetch their money key directly now that we have the id.
                const balance = Database.get(`player:${foundId}:money`) || 0
                player.sendMessage(`\xA7a\xA7l» \xA7f${foundName}'s balance: \xA7e$${balance.toLocaleString()}\xA7f.`);
            } else {
                // otherwise, they don't exist in our records.
                player.sendMessage(`\xA7c\xA7l» \xA77Player '${targetName}' not found.`);
            }
        }
    }
}
