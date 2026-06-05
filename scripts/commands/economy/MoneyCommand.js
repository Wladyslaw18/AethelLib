import { Kernel } from "../../core/Kernel.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { PlayerUtils } from "../../utils/PlayerUtils.js"

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
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fYour balance: \u00A7e$${balance.toLocaleString()}\u00A7f.`);
            return
        }

        // case 2: check if the target is online.
        const targetPlayer = Kernel.world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase())
        
        if (targetPlayer) {
            // fast path: pull from online cache.
            const balance = EconomyStore.getBalance(targetPlayer)
            player.sendMessage(`\u00A7a\u00A7l» \u00A7f${targetPlayer.name}'s balance: \u00A7e$${balance.toLocaleString()}\u00A7f.`);
        } else {
            // case 3: target is offline. we do a fast O(1) database lookup.
            const Database = Kernel.get("database")
            const foundId = PlayerUtils.getIdByName(targetName)

            if (foundId && Database) {
                const foundName = Database.get(`player:${foundId}:name`) || targetName
                const balance = Database.get(`player:${foundId}:money`) ?? EconomyStore.DEFAULT_BALANCE
                player.sendMessage(`\u00A7a\u00A7l» \u00A7f${foundName}'s balance: \u00A7e$${balance.toLocaleString()}\u00A7f.`);
            } else {
                // otherwise, they don't exist in our records.
                player.sendMessage(`\u00A7c\u00A7l» \u00A77Player '${targetName}' not found.`);
            }
        }
    }
}
