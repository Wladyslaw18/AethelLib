/**
 * Claim UI - Owner-only menu for claim management
 * Smith Forge Rule: Max 100 lines per file
 * Zero-Eval, Identity Rule: UUIDs only
 * Cache-Aside: JS Map cache + debounced Dynamic Property write
 */

import { world, system, ActionFormData } from "@minecraft/server"
import { 
    locationToChunkKey, 
    getClaim, 
    isOwner,
    addTrusted,
    removeTrusted,
    getPlayerClaims
} from "../systems/protection/ClaimStore.js"
import { PERMISSIONS } from "../systems/protection/ClaimService.js"

/**
 * Show claim management UI
 * @param {Player} player - Player to show UI to
 */
export function showClaimUI(player) {
    const location = player.location
    const chunkKey = locationToChunkKey(location)
    const claim = getClaim(chunkKey)

    // Check if player owns claim at current location
    if (!isOwner(chunkKey, player.id)) {
        player.sendMessage("§cYou don't own any claim here!")
        return
    }

    const form = new ActionFormData()
        .title("§6Claim Management")
        .body("Manage your claim permissions and trusted players")

    // Add trusted player option
    form.button("§aAdd Trusted Player", null)
    
    // Remove trusted player option
    form.button("§cRemove Trusted Player", null)
    
    // Toggle permissions options
    form.button("§eToggle Build Permission", null)
    form.button("§eToggle Chest Permission", null)
    form.button("§eToggle Door Permission", null)
    form.button("§eToggle Container Permission", null)

    system.run(() => {
        form.show(player).then(response => {
            if (response.canceled) return

            switch (response.selection) {
                case 0: // Add trusted player
                    showAddTrustedUI(player, chunkKey)
                    break
                case 1: // Remove trusted player
                    showRemoveTrustedUI(player, chunkKey)
                    break
                case 2: // Toggle build permission
                    togglePermission(player, chunkKey, "build", PERMISSIONS.BUILD)
                    break
                case 3: // Toggle chest permission
                    togglePermission(player, chunkKey, "chests", PERMISSIONS.CHESTS)
                    break
                case 4: // Toggle door permission
                    togglePermission(player, chunkKey, "doors", PERMISSIONS.DOORS)
                    break
                case 5: // Toggle container permission
                    togglePermission(player, chunkKey, "containers", PERMISSIONS.CONTAINERS)
                    break
            }
        })
    })
}

/**
 * Show add trusted player UI
 * @param {Player} player - Player to show UI to
 * @param {string} chunkKey - Claim chunk key
 */
function showAddTrustedUI(player, chunkKey) {
    const form = new ActionFormData()
        .title("§aAdd Trusted Player")
        .body("Enter player name to trust and select permissions")

    // Permission checkboxes
    form.toggle("Build Permission", true)
    form.toggle("Chest Permission", true)
    form.toggle("Door Permission", true)
    form.toggle("Container Permission", true)

    form.textField("Player Name", "Enter exact player name")

    system.run(() => {
        form.show(player).then(response => {
            if (response.canceled || !response.formValues[0]) return

            const playerName = response.formValues[0].trim()
            if (!playerName) {
                player.sendMessage("§cPlease enter a player name!")
                return
            }

            // Calculate permission bitmask
            let permissions = 0
            if (response.formValues[1]) permissions |= PERMISSIONS.BUILD
            if (response.formValues[2]) permissions |= PERMISSIONS.CHESTS
            if (response.formValues[3]) permissions |= PERMISSIONS.DOORS
            if (response.formValues[4]) permissions |= PERMISSIONS.CONTAINERS

            const target = world.getPlayers().find(p => p.name === playerName)
            if (!target) {
                player.sendMessage(`§cPlayer ${playerName} not found!`)
                return
            }

            addTrusted(chunkKey, player.id, target.id, permissions)
            player.sendMessage(`§aAdded ${playerName} with permissions ${permissions}!`)
        })
    })
}

/**
 * Show remove trusted player UI
 * @param {Player} player - Player to show UI to
 * @param {string} chunkKey - Claim chunk key
 */
function showRemoveTrustedUI(player, chunkKey) {
    const claim = getClaim(chunkKey)
    if (!claim?.trusted || Object.keys(claim.trusted).length === 0) {
        player.sendMessage("§cNo trusted players to remove!")
        return
    }

    const form = new ActionFormData()
        .title("§cRemove Trusted Player")
        .body("Select player to remove from trusted list")

    // Add trusted players as buttons
    for (const trustedId of Object.keys(claim.trusted)) {
        const target = world.getPlayers().find(p => p.id === trustedId)
        const playerName = target ? target.name : "Unknown"
        form.button(`§c${playerName}`, null)
    }

    system.run(() => {
        form.show(player).then(response => {
            if (response.canceled) return

            const trustedIds = Object.keys(claim.trusted)
            const selectedId = trustedIds[response.selection]
            
            if (selectedId) {
                removeTrusted(chunkKey, selectedId)
                const target = world.getPlayers().find(p => p.id === selectedId)
                const playerName = target ? target.name : "Unknown"
                player.sendMessage(`§aRemoved ${playerName} from trusted list!`)
            }
        })
    })
}

/**
 * Toggle permission for all trusted players
 * @param {Player} player - Claim owner
 * @param {string} chunkKey - Claim chunk key
 * @param {string} permissionType - Type of permission
 * @param {number} permissionBit - Permission bitmask
 */
function togglePermission(player, chunkKey, permissionType, permissionBit) {
    const claim = getClaim(chunkKey)
    if (!claim?.trusted) {
        player.sendMessage("§cNo trusted players to modify permissions for!")
        return
    }

    // Toggle permission for all trusted players
    for (const [trustedId, currentPerms] of Object.entries(claim.trusted)) {
        const newPerms = currentPerms ^ permissionBit // Toggle bit
        claim.trusted[trustedId] = newPerms
    }

    setClaim(chunkKey, claim)
    player.sendMessage(`§aToggled ${permissionType} permission for all trusted players!`)
}

