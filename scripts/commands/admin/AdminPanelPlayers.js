/**
 * Admin Panel Players - Player management sub-panel
 */

import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"

/** @typedef {import("@minecraft/server").Player} Player */

export async function showPlayerManagement(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("§cNo permission.")
        return
    }
    const form = new ActionFormData()
        .title("§6§lPlayer Management")
        .body("Select a player management action")
        .button("§aKick Player")
        .button("§cBan Player")
        .button("§eUnban Player")
        .button("§bMute Player")
        .button("§dUnmute Player")
        .button("§fView Inventory")
        .button("§6Teleport Player")
        .button("§cBack")

    const res = await form.show(player)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            await showKickInterface(player)
            break
        case 1:
            await showBanInterface(player)
            break
        case 2:
            await showUnbanInterface(player)
            break
        case 3:
            await showMuteInterface(player)
            break
        case 4:
            await showUnmuteInterface(player)
            break
        case 5:
            player.sendMessage("§7Inventory view interface coming soon...")
            await showPlayerManagement(player)
            break
        case 6:
            player.sendMessage("§7Teleport interface coming soon...")
            await showPlayerManagement(player)
            break
        case 7:
            await showAdminPanel(player)
            break
    }
}

async function showKickInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("§cNo players online")
        await showPlayerManagement(player)
        return
    }

    const form = new ActionFormData()
        .title("§6§lKick Player")
        .body("Select a player to kick")

    players.forEach(p => form.button(p.name))

    form.button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === players.length) {
        await showPlayerManagement(player)
        return
    }

    const target = players[res.selection]
    
    const reasonForm = new ModalFormData()
        .title("§6§lKick Reason")
        .textField("Reason:", "No reason provided")
        .toggle("Confirm Kick", { defaultValue: false })

    const reasonRes = await reasonForm.show(player)
    if (reasonRes.canceled || !reasonRes.formValues[1]) {
        await showPlayerManagement(player)
        return
    }

    const reason = reasonRes.formValues[0] || "No reason provided"
    
    Kernel.system.run(() => {
        try {
            player.runCommand(`kick "${target.name}" ${reason}`)
            player.sendMessage(`§aSuccessfully kicked ${target.name} for: ${reason}`)
        } catch (error) {
            player.sendMessage(`§cFailed to kick ${target.name}: ${error.message}`)
        }
    })

    await showPlayerManagement(player)
}

async function showBanInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("§cNo players online")
        await showPlayerManagement(player)
        return
    }

    const form = new ActionFormData()
        .title("§6§lBan Player")
        .body("Select a player to ban")

    players.forEach(p => form.button(p.name))

    form.button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === players.length) {
        await showPlayerManagement(player)
        return
    }

    const target = players[res.selection]
    
    const reasonForm = new ModalFormData()
        .title("§6§lBan Reason")
        .textField("Reason:", "No reason provided")
        .toggle("Confirm Ban", { defaultValue: false })

    const reasonRes = await reasonForm.show(player)
    if (reasonRes.canceled || !reasonRes.formValues[1]) {
        await showPlayerManagement(player)
        return
    }

    const reason = reasonRes.formValues[0] || "No reason provided"
    
    Kernel.system.run(() => {
        try {
            player.runCommand(`kick "${target.name}" ${reason}`)
            player.sendMessage(`§aSuccessfully banned ${target.name} for: ${reason}`)
        } catch (error) {
            player.sendMessage(`§cFailed to ban ${target.name}: ${error.message}`)
        }
    })

    await showPlayerManagement(player)
}

async function showUnbanInterface(player) {
    const nameForm = new ModalFormData()
        .title("§6§lUnban Player")
        .textField("Player Name:", "Enter player name to unban")

    const nameRes = await nameForm.show(player)
    if (nameRes.canceled || !nameRes.formValues[0]) {
        await showPlayerManagement(player)
        return
    }

    const playerName = nameRes.formValues[0]
    player.sendMessage(`§7Unban interface for ${playerName} coming soon...`)
    await showPlayerManagement(player)
}

async function showMuteInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("§cNo players online")
        await showPlayerManagement(player)
        return
    }

    const form = new ActionFormData()
        .title("§6§lMute Player")
        .body("Select a player to mute")

    players.forEach(p => form.button(p.name))

    form.button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === players.length) {
        await showPlayerManagement(player)
        return
    }

    const target = players[res.selection]
    player.sendMessage(`§7Mute interface for ${target.name} coming soon...`)
    await showPlayerManagement(player)
}

async function showUnmuteInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("§cNo players online")
        await showPlayerManagement(player)
        return
    }

    const form = new ActionFormData()
        .title("§6§lUnmute Player")
        .body("Select a player to unmute")

    players.forEach(p => form.button(p.name))

    form.button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === players.length) {
        await showPlayerManagement(player)
        return
    }

    const target = players[res.selection]
    player.sendMessage(`§7Unmute interface for ${target.name} coming soon...`)
    await showPlayerManagement(player)
}

