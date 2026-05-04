/**
 * Claim Command - Access chunk protection system
 * Smith Forge Rule: Max 100 lines per file
 */

import { showClaimUI } from "../../ui/protection/ClaimUI.js"
import { 
    createClaim, 
    removeClaim, 
    trustPlayer, 
    untrustPlayer 
} from "../../systems/protection/ClaimService.js"

export const ClaimCommand = {
    name: "claim",
    description: "Manage land claims and protection",
    usage: "!claim <subcommand> [args...]",
    permission: "essentials.default",
    category: "general",

    execute(data, player, args) {
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
                player.sendMessage(`§cUnknown subcommand: §e${subcommand}`)
                this.showHelp(player)
        }
    },

    /**
     * Handle claim creation
     */
    handleCreate(player, args) {
        const radius = parseInt(args[0]) || 1
        if (radius < 1 || radius > 5) {
            player.sendMessage("§cRadius must be between 1 and 5 chunks!")
            return
        }

        createClaim(player, player.location, radius)
    },

    /**
     * Handle claim removal
     */
    handleRemove(player) {
        removeClaim(player, player.location)
    },

    /**
     * Handle trusting players
     */
    handleTrust(player, args) {
        if (args.length < 1) {
            player.sendMessage("§cUsage: !claim trust <player> [permissions]")
            return
        }

        const playerName = args[0]
        const permissions = this.parsePermissions(args[1])
        trustPlayer(player, playerName, permissions)
    },

    /**
     * Handle untrusting players
     */
    handleUntrust(player, args) {
        if (args.length < 1) {
            player.sendMessage("§cUsage: !claim untrust <player>")
            return
        }

        untrustPlayer(player, args[0])
    },

    /**
     * Parse permission string to bitmask
     */
    parsePermissions(permString) {
        if (!permString) return 15 // All permissions

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

    /**
     * Show help information
     */
    showHelp(player) {
        player.sendMessage("§6§lClaim Command Help")
        player.sendMessage("§7Subcommands:")
        player.sendMessage("  §emenu/ui §7- Open claim management menu")
        player.sendMessage("  §ecreate [radius] §7- Create claim (1-5 chunks)")
        player.sendMessage("  §eremove §7- Remove claim at current location")
        player.sendMessage("  §etrust <player> [perms] §7- Trust player")
        player.sendMessage("  §euntrust <player> §7- Remove trust")
        player.sendMessage("§7Permissions: build, chests, doors, containers, all")
        player.sendMessage("§7Example: !claim trust Steve build,chests")
    }
}

