import { showClaimUI } from "../../ui/protection/ClaimUI.js"
import { 
    createClaim, 
    removeClaim, 
    trustPlayer, 
    untrustPlayer 
} from "../../systems/protection/ClaimService.js"
import { Kernel } from "../../core/Kernel.js"

// ----------------------------------------------------------------------------
// | object: ClaimCommand                                                     |
// | command definition for the chunk protection and permission system.        |
// | handles land acquisition, decommissioning, and player trust-nodes.        |
// ----------------------------------------------------------------------------
export const ClaimCommand = {
    // internal identifier.
    name: "claim",
    // human-readable description.
    description: "Orchestrates spatial protection and entity trust-nodes.",
    // syntax guide.
    usage: "/ae:claim <subcommand> [args...]",
    // required permission level.
    permission: "essentials.default",
    // command category.
    category: "General",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the subcommand routing engine. parses the first argument and delegates    |
    // | the logic to specialized handlers.                                       |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // the first argument determines the operational vector.
        const subcommand = args[0]?.toLowerCase()

        // if no subcommand, show the manual.
        if (!subcommand) {
            this.showHelp(player)
            return
        }

        // route based on token.
        switch (subcommand) {
            case "menu":
            case "ui":
                // open the visual management dashboard.
                showClaimUI(player)
                break
            case "create":
                // start a new land acquisition.
                this.handleCreate(player, args.slice(1))
                break
            case "remove":
                // delete the claim at the player's current location.
                this.handleRemove(player)
                break
            case "trust":
                // grant permissions to another player.
                this.handleTrust(player, args.slice(1))
                break
            case "untrust":
                // revoke permissions from another player.
                this.handleUntrust(player, args.slice(1))
                break
            default:
                // unknown subcommand.
                player.sendMessage(`\xA7c\xA7l[Error] \xA77Unknown claim vector: '${subcommand}'`);
                this.showHelp(player)
        }
    },

    // ----------------------------------------------------------------------------
    // | method: handleCreate                                                     |
    // | calculates spatial constraints and enforces rank-based quotas.            |
    // ----------------------------------------------------------------------------
    handleCreate(player, args) {
        // resolve radius. 1 means a single chunk, 5 is a massive square.
        const radius = parseInt(args[0]) || 1
        // constraint: don't let them claim the entire world at once.
        if (radius < 1 || radius > 5) {
            player.sendMessage("\xA7c\xA7l[Error] \xA77Spatial constraint violation: Radius must be 1-5 chunks.");
            return
        }

        // fetch the core services from the kernel.
        const ClaimStore = Kernel.get("claimStore");
        const PermissionManager = Kernel.get("permissions");

        // get current ownership count.
        const currentClaims = ClaimStore.getPlayerClaims(player.id).length;
        
        // calculate the impact of the new request (square of diameter).
        const chunksToClaim = Math.pow((radius * 2) + 1, 2); 
        
        // resolve the player's maximum allowance based on their rank node.
        const maxClaims = PermissionManager.getHighestRank(player)?.permissions["limit.land"] || 1;

        // check if this acquisition would exceed their industrial limit.
        if (currentClaims + chunksToClaim > maxClaims) {
            player.sendMessage(`\xA7c\xA7l» \xA77Claim limit reached! You have ${currentClaims}/${maxClaims} chunks.`);
            return;
        }

        // all clear. trigger the creation logic in the service.
        createClaim(player, player.location, radius)
    },

    // simple bridge to the removal service.
    handleRemove(player) {
        removeClaim(player, player.location)
    },

    // bridge to trust injection with permission parsing.
    handleTrust(player, args) {
        if (args.length < 1) {
            player.sendMessage("\xA7e\xA7l[Manual] \xA77Syntax Hint: /ae:claim trust <player> [permissions]");
            return
        }

        const playerName = args[0]
        // parse the CSV permission string into a 4-bit mask.
        const permissions = this.parsePermissions(args[1])
        trustPlayer(player, playerName, permissions)
    },

    // revoke trust.
    handleUntrust(player, args) {
        if (args.length < 1) {
            player.sendMessage("\xA7e\xA7l[Manual] \xA77Syntax Hint: /ae:claim untrust <player>");
            return
        }

        untrustPlayer(player, args[0])
    },

    // ----------------------------------------------------------------------------
    // | method: parsePermissions                                                 |
    // | transforms a user-friendly CSV string into a technical 4-bit mask.       |
    // | B1: Build, B2: Chests, B3: Doors, B4: Containers.                        |
    // ----------------------------------------------------------------------------
    parsePermissions(permString) {
        // if no permissions specified, default to full clearance (1111 binary = 15 dec).
        if (!permString) return 15 

        let permissions = 0
        const parts = permString.toLowerCase().split(',')

        // iterative bitwise OR operation.
        for (const part of parts) {
            switch (part.trim()) {
                case "build":      permissions |= 1; break
                case "chests":     permissions |= 2; break
                case "doors":      permissions |= 4; break
                case "containers": permissions |= 8; break
                case "all":        permissions = 15; break
            }
        }

        return permissions
    },

    // ----------------------------------------------------------------------------
    // | method: showHelp                                                         |
    // | displays the operation manual for the claim system.                      |
    // ----------------------------------------------------------------------------
    showHelp(player) {
        player.sendMessage(" ")
        player.sendMessage("\xA76\xA7lCLAIM_SYSTEM_MANUAL")
        player.sendMessage("\xA77Sub-vectors:")
        player.sendMessage("  \xA7emenu/ui \xA77- Spawns management GUI.")
        player.sendMessage("  \xA7ecreate [radius] \xA77- Acquires 1-5 chunks.")
        player.sendMessage("  \xA7eremove \xA77- Decommissions current claim.")
        player.sendMessage("  \xA7etrust <player> [perms] \xA77- Injects trust-node.")
        player.sendMessage("  \xA7euntrust <player> \xA77- Terminating trust-node.")
        player.sendMessage(" ")
        player.sendMessage("\xA77Node_Types: \xA7fbuild, chests, doors, containers, all")
        player.sendMessage(" ")
    }
}
