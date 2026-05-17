import { EconomyStore } from "../../systems/economy/EconomyStore.js"

// ----------------------------------------------------------------------------
// | object: TopMoneyCommand                                                  |
// | command definition for displaying the financial leaderboard.              |
// | pulls all known balances and sorts them for public display.               |
// ----------------------------------------------------------------------------
export const TopMoneyCommand = {
    // internal name.
    name: "topmoney",
    // human-readable description.
    description: "View the richest players on the server",
    // syntax guide.
    usage: "/ae:topmoney",
    // required permission node.
    permission: "essentials.money",
    // command category.
    category: "ECONOMY",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the leaderboard query pipeline. fetches data, sorts by liquidity,        |
    // | and formats the results for chat output.                                 |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // pull all records from the economy store.
        const balances = EconomyStore.getAllBalances()
        
        // safety check for empty databases.
        if (balances.length === 0) {
            player.sendMessage("\xA7c\xA7l» \xA77No balances found.");
            return
        }

        // step 1: sorting.
        // sort by balance descending (richest first).
        balances.sort((a, b) => b.balance - a.balance)
        // limit the results to the top 10 for readability.
        const topPlayers = balances.slice(0, 10)

        // step 2: formatting.
        player.sendMessage(" ")
        player.sendMessage("\xA76\xA7lRichest Players \xA78(Top 10)")

        // loop through and print each entry.
        for (let i = 0; i < topPlayers.length; i++) {
            const entry = topPlayers[i]
            // dynamic color mapping for the top 3 spots (Gold, Silver, Bronze/White).
            const color = i === 0 ? "\xA76\xA7l" : i === 1 ? "\xA7e\xA7l" : i === 2 ? "\xA7f\xA7l" : "\xA77"
            player.sendMessage(`${color}${i + 1}. \xA7f${entry.name} \xA78- \xA7a$${entry.balance.toLocaleString()}`)
        }
        player.sendMessage(" ")
    }
}
