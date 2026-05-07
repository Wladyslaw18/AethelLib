import { showClaimUI } from "../../ui/protection/ClaimUI.js"
import { 
    createClaim, 
    removeClaim, 
    trustPlayer, 
    untrustPlayer 
} from "../../systems/protection/ClaimService.js"

/*
 * LAND_CLAIM_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Handles the user-facing interface for the chunk protection system. 
 * Provides subcommands for node creation, decommissioning, and 
 * permission (trust) management.
 *
 * PHILOSOPHY: Private property is protected by industrial-grade bitmasks. 
 * If you don't trust someone, don't give them build-access.
 */
export const ClaimCommand = {
    name: "claim",
    description: "Orchestrates spatial protection and entity trust-nodes.",
    usage: "/ae:claim <subcommand> [args...]",
    permission: "essentials.default",
    category: "General",

    /* 
     * SUBCOMMAND_ROUTING_ENGINE
     */
    execute(_data, player, args) {
        const subcommand = args[0]?.toLowerCase()

        if (!subcommand) {
            this.showHelp(player)
            return
        }

        switch (subcommand) {
            case "menu":
            case "ui":
                showClaimUI(player)
                break
            case "create":
                this.handleCreate(player, args.slice(1))
                break
            case "remove":
                this.handleRemove(player)
                break
            case "trust":
                this.handleTrust(player, args.slice(1))
                break
            case "untrust":
                this.handleUntrust(player, args.slice(1))
                break
            default:
                player.sendMessage(`[Error] Unknown claim vector: '${subcommand}'`);
                this.showHelp(player)
        }
    },

    /*
     * SPATIAL_ACQUISITION_HANDLER
     */
    handleCreate(player, args) {
        const radius = parseInt(args[0]) || 1
        if (radius < 1 || radius > 5) {
            player.sendMessage("[Error] Spatial constraint violation: Radius must be 1-5 chunks.");
            return
        }

        createClaim(player, player.location, radius)
    },

    /*
     * SPATIAL_DECOMMISSION_HANDLER
     */
    handleRemove(player) {
        removeClaim(player, player.location)
    },

    /*
     * TRUST_NODE_INJECTION_HANDLER
     */
    handleTrust(player, args) {
        if (args.length < 1) {
            player.sendMessage("[Manual] Syntax Hint: !claim trust <player> [permissions]");
            return
        }

        const playerName = args[0]
        const permissions = this.parsePermissions(args[1])
        trustPlayer(player, playerName, permissions)
    },

    /*
     * TRUST_NODE_TERMINATION_HANDLER
     */
    handleUntrust(player, args) {
        if (args.length < 1) {
            player.sendMessage("[Manual] Syntax Hint: !claim untrust <player>");
            return
        }

        untrustPlayer(player, args[0])
    },

    /*
     * PERMISSION_BITMASK_PARSER
     * ----------------------------------------------------------------------------
     * Transforms a CSV string into a 4-bit auth mask. 
     * B1: Build, B2: Chests, B3: Doors, B4: Containers.
     */
    parsePermissions(permString) {
        if (!permString) return 15 // DEFAULT_ALL_CLEARANCE

        let permissions = 0
        const parts = permString.toLowerCase().split(',')

        for (const part of parts) {
            switch (part.trim()) {
                case "build": permissions |= 1; break
                case "chests": permissions |= 2; break
                case "doors": permissions |= 4; break
                case "containers": permissions |= 8; break
                case "all": permissions = 15; break
            }
        }

        return permissions
    },

    /* 
     * MANUAL_GENERATOR
     */
    showHelp(player) {
        player.sendMessage("§6§lCLAIM_SYSTEM_MANUAL")
        player.sendMessage("§7Sub-vectors:")
        player.sendMessage("  §emenu/ui §7- Spawns management GUI.")
        player.sendMessage("  §ecreate [radius] §7- Acquires 1-5 chunks.")
        player.sendMessage("  §eremove §7- Decommissions current claim.")
        player.sendMessage("  §etrust <player> [perms] §7- Injects trust-node.")
        player.sendMessage("  §euntrust <player> §7- Terminating trust-node.")
        player.sendMessage("§7Node_Types: build, chests, doors, containers, all")
    }
}
