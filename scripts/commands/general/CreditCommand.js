/*
 * SYSTEM_CREDITS_MANIFEST
 * ----------------------------------------------------------------------------
 * A static manual-page documenting the architectural contributors and 
 * industrial principles behind the Aethelgrad Essentials rebuild.
 *
 * PHILOSOPHY: We broadcast our design standards to ensure the users 
 * understand the security-first engineering that powers their experience.
 */
export const CreditCommand = {
    name: "credit",
    description: "View the project credits",
    usage: "/ae:credit",
    permission: "essentials.credit",
    category: "Utility",

    execute(_data, player, _args) {
        player.sendMessage(" ")
        player.sendMessage("§6§lAethel§fLib §7- Credits")
        player.sendMessage("§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        player.sendMessage(" ")
        player.sendMessage("§6§lLead Architect")
        player.sendMessage("§f- Wladyslaw")
        player.sendMessage(" ")
        player.sendMessage("§6§lCore Systems")
        player.sendMessage("§f- Economy & Auction House")
        player.sendMessage("§f- Advanced Teleportation")
        player.sendMessage("§f- Social & Chat Security")
        player.sendMessage("§f- Administrative Tools")
        player.sendMessage(" ")
        player.sendMessage("§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        player.sendMessage("§7Optimized for high-performance survival gameplay.")
        player.sendMessage("§7Version: §e1.26.20 §7| §fClean Build")
        player.sendMessage(" ")
    }

}
