// ----------------------------------------------------------------------------
// | object: CreditCommand                                                    |
// | command definition for displaying project contributors and metadata.      |
// | purely informational static output.                                       |
// ----------------------------------------------------------------------------
export const CreditCommand = {
    // internal name.
    name: "credit",
    // human-readable description.
    description: "View the project credits",
    // syntax guide.
    usage: "/ae:credit",
    // required permission node.
    permission: "essentials.credit",
    // command category.
    category: "Utility",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | prints the attribution list and versioning info to the chat.             |
    // ----------------------------------------------------------------------------
    execute(_data, player, _args) {
        player.sendMessage(" ")
        player.sendMessage("\xA76\xA7lAethel\xA7fLib \xA77- Credits")
        player.sendMessage("\xA78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        player.sendMessage(" ")
        // credit to the lead architect.
        player.sendMessage("\xA76\xA7lLead Architect")
        player.sendMessage("\xA7f- Wladyslaw")
        player.sendMessage(" ")
        // list of core technical pillars.
        player.sendMessage("\xA76\xA7lCore Systems")
        player.sendMessage("\xA7f- Economy & Auction House")
        player.sendMessage("\xA7f- Advanced Teleportation")
        player.sendMessage("\xA7f- Social & Chat Security")
        player.sendMessage("\xA7f- Administrative Tools")
        player.sendMessage(" ")
        player.sendMessage("\xA78━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        // system philosophy footer.
        player.sendMessage("\xA77Optimized for high-performance survival gameplay.")
        player.sendMessage("\xA77Version: \xA7e1.26.20 \xA77| \xA7fClean Build")
        player.sendMessage(" ")
    }
}
