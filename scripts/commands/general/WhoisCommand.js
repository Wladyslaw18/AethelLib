import { Kernel } from "../../core/Kernel.js"

/*
 * IDENTITY_INTERROGATION_VECTOR
 * ----------------------------------------------------------------------------
 * A high-performance diagnostic tool for auditing an entity's metadata. 
 * Performs a deep-scan across multiple sub-systems (Permissions, Economy, 
 * TPA) to generate a comprehensive identity-profile.
 *
 * PHILOSOPHY: Privacy is a myth in an industrial empire. If you exist 
 * on the server, your metrics are subject to audit.
 */
export const WhoisCommand = {
    name: "whois",
    description: "Executes a deep-scan audit of a specific entity's metadata.",
    usage: "!whois <player_identifier>",
    permission: "essentials.whois",
    category: "Utility",
    aliases: ["inspect", "id"],

    /* 
     * AUDIT_PIPELINE
     */
    execute(_data, player, args) {
        const targetName = args[0]
        if (!targetName) {
            player.sendMessage("[Manual] Syntax Error: Player identifier required.");
            return
        }

        /* 
         * ENTITY_RESOLUTION
         */
        const target = [...Kernel.world.getAllPlayers()].find(p => 
            p.name.toLowerCase() === targetName.toLowerCase()
        )

        if (!target) {
            player.sendMessage(`[Error] Entity '${targetName}' not found in active buffer.`);
            return
        }

        /* 
         * SUB-SYSTEM_DATA_HARVEST
         */
        const PermissionManager = Kernel.get("permissions")
        const Economy = Kernel.get("economy")
        const TpaStore = Kernel.get("tpaStore")
        
        const rank = PermissionManager.getHighestRank(target)
        const balance = Economy.getBalance(target)
        const tpaStatus = TpaStore.isEnabled(target.id) ? "§aACTIVE" : "§cSTANDBY"

        /* 
         * PROFILE_BROADCAST
         */
        player.sendMessage(`§0§l» §6§lIDENTITY_AUDIT: ${target.name}§0 «`)
        player.sendMessage(`§7HARDWARE_UUID: §8${target.id}`)
        player.sendMessage(`§7AUTH_LEVEL: §e${rank?.displayName || "MEMBER"}`)
        player.sendMessage(`§7LIQUIDITY_BUFFER: §6$${balance}`)
        player.sendMessage(`§7SPATIAL_COORDS: §b${target.dimension.id.split(':')[1].toUpperCase()} §8(${Math.floor(target.location.x)}, ${Math.floor(target.location.y)}, ${Math.floor(target.location.z)})`)
        player.sendMessage(`§7TPA_PROTOCOL: ${tpaStatus}`)
    }
}
