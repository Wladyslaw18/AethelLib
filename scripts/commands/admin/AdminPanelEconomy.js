/**
 * Admin Panel Economy - Economy control sub-panel
 */

import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"

/** @typedef {import("@minecraft/server").Player} Player */

export async function showEconomyControl(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("§cNo permission.")
        return
    }
    const form = new ActionFormData()
        .title("§6§lEconomy Control")
        .body("Select an economy action")
        .button("§aGive Money")
        .button("§bTake Money")
        .button("§cSet Balance")
        .button("§eView Economy Stats")
        .button("§fReset Economy")
        .button("§cBack")

    const res = await form.show(player)
    if (res.canceled) return

    switch (res.selection) {
        case 0:
            await showGiveMoneyInterface(player)
            break
        case 1:
            await showTakeMoneyInterface(player)
            break
        case 2:
            await showSetBalanceInterface(player)
            break
        case 3:
            player.sendMessage("§7Economy stats interface coming soon...")
            await showEconomyControl(player)
            break
        case 4:
            player.sendMessage("§7Reset economy interface coming soon...")
            await showEconomyControl(player)
            break
        case 5:
            await showAdminPanel(player)
            break
    }
}

async function showGiveMoneyInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("§cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new ActionFormData()
        .title("§6§lGive Money")
        .body("Select a player to give money to")

    players.forEach(p => form.button(p.name))

    form.button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new ModalFormData()
        .title("§6§lGive Money")
        .textField("Amount:", "1000")
        .toggle("Confirm Give", { defaultValue: false })

    const amountRes = await amountForm.show(player)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount <= 0) {
        player.sendMessage("§cInvalid amount. Must be a positive number.")
        await showEconomyControl(player)
        return
    }

    player.sendMessage(`§7Give money interface for ${target.name} (${amount}) coming soon...`)
    await showEconomyControl(player)
}

async function showTakeMoneyInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("§cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new ActionFormData()
        .title("§6§lTake Money")
        .body("Select a player to take money from")

    players.forEach(p => form.button(p.name))

    form.button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new ModalFormData()
        .title("§6§lTake Money")
        .textField("Amount:", "1000")
        .toggle("Confirm Take", { defaultValue: false })

    const amountRes = await amountForm.show(player)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount <= 0) {
        player.sendMessage("§cInvalid amount. Must be a positive number.")
        await showEconomyControl(player)
        return
    }

    player.sendMessage(`§7Take money interface for ${target.name} (${amount}) coming soon...`)
    await showEconomyControl(player)
}

async function showSetBalanceInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("§cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new ActionFormData()
        .title("§6§lSet Balance")
        .body("Select a player to set balance for")

    players.forEach(p => form.button(p.name))

    form.button("§cBack")

    const res = await form.show(player)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new ModalFormData()
        .title("§6§lSet Balance")
        .textField("New Balance:", "1000")
        .toggle("Confirm Set", { defaultValue: false })

    const amountRes = await amountForm.show(player)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount < 0) {
        player.sendMessage("§cInvalid amount. Must be a non-negative number.")
        await showEconomyControl(player)
        return
    }

    player.sendMessage(`§7Set balance interface for ${target.name} (${amount}) coming soon...`)
    await showEconomyControl(player)
}

