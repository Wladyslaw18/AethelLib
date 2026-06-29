/**
 * Player UI — Hub for TPA, Pay, and Online List
 */

import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"

/**
 * Show the player interaction menu
 * @param {import("@minecraft/server").Player} player
 */
export async function showPlayerUI(player) {
    const form = new ActionFormData()
        .title("§0§l» §b§lPLAYER INTERFACE§0 «")
        .body("§7Social & Economic Controls")
        .button("§lTPA REQUESTS\n§8Teleport requests", "textures/ui/send_icon")
        .button("§lPAY PLAYER\n§8Transfer currency", "textures/ui/icon_recipe_item")
        .button("§lONLINE LIST\n§8View active players", "textures/ui/multiplayer_glyph")
        .button("§c← Back")

    // @ts-ignore
    const response = await form.show(player)
    if (response.canceled) return

    switch (response.selection) {
        case 0: return showTpaMenu(player)
        case 1: return showPayMenu(player)
        case 2: return showOnlineList(player)
        case 3: {
            const { showMainGUI } = await import("../MainGUI.js")
            return showMainGUI(player)
        }
    }
}

/**
 * Show TPA management menu
 */
async function showTpaMenu(player) {
    const form = new ActionFormData()
        .title("§0§l» §d§lTPA CONTROLS§0 «")
        .body("§7Manage teleportation requests")
        .button("§lTPA TO PLAYER\n§8Request to teleport", "textures/ui/request")
        .button("§lTPA HERE\n§8Request player to you", "textures/ui/move")
        .button("§lACCEPT\n§8Accept last request", "textures/ui/confirm")
        .button("§lDENY\n§8Deny last request", "textures/ui/cancel")
        .button("§c← Back")

    const response = await form.show(player)
    if (response.canceled) return

    const CommandHandler = Kernel.get("commandHandler")

    switch (response.selection) {
        case 0: {
            const target = await selectPlayer(player, "Request to TPA to:")
            if (target) CommandHandler.executeCommand(player, `tpa ${target}`)
            break
        }
        case 1: {
            const target = await selectPlayer(player, "Request TPA here:")
            if (target) CommandHandler.executeCommand(player, `tpahere ${target}`)
            break
        }
        case 2: return CommandHandler.executeCommand(player, "tpaccept")
        case 3: return CommandHandler.executeCommand(player, "tpdeny")
        case 4: return showPlayerUI(player)
    }
}

/**
 * Show Pay menu
 */
async function showPayMenu(player) {
    const targetName = await selectPlayer(player, "Select player to pay:")
    if (!targetName) return showPlayerUI(player)

    const form = new ModalFormData()
        .title(`§6Pay: ${targetName}`)
        .textField("Amount to transfer", "e.g. 500")

    const response = await form.show(player)
    if (response.canceled) return showPlayerUI(player)

    const amount = parseInt(response.formValues[0])
    if (isNaN(amount) || amount <= 0) {
        player.sendMessage("§cInvalid amount!")
        return
    }

    const CommandHandler = Kernel.get("commandHandler")
    CommandHandler.executeCommand(player, `pay ${targetName} ${amount}`)
}

/**
 * Show online list with ranks
 */
async function showOnlineList(player) {
    const players = Kernel.world.getAllPlayers()
    const PermissionManager = Kernel.get("permissions")
    
    let body = "§7Active Players:\n\n"
    for (const p of players) {
        const rank = PermissionManager.getHighestRank(p)
        const rankDisplay = rank?.displayName || "§7Member"
        body += `§8- ${rankDisplay} §f${p.name}\n`
    }

    const form = new ActionFormData()
        .title("§0§l» §f§lONLINE LIST§0 «")
        .body(body)
        .button("§c← Back")

    const response = await form.show(player)
    if (response.canceled) return
    return showPlayerUI(player)
}

/**
 * Helper to select a player from online list
 */
async function selectPlayer(player, title) {
    const players = Kernel.world.getAllPlayers().filter(p => p.id !== player.id)
    if (players.length === 0) {
        player.sendMessage("§cNo other players online!")
        return null
    }

    const form = new ActionFormData()
        .title(title)
        .body("Select a player:")

    for (const p of players) {
        form.button(p.name)
    }

    const response = await form.show(player)
    if (response.canceled) return null

    return players[response.selection].name
}
