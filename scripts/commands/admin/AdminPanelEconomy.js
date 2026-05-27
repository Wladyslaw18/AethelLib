/**
 * Admin Panel Economy - Economy control sub-panel
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { UIUtils } from "../../ui/UIUtils.js"

/** @typedef {import("@minecraft/server").Player} Player */

export async function showEconomyControl(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }
    const form = new Kernel.ActionFormData()
        .title("\u00A7a\u00A7e\u00A7m\u00A76\u00A7lEconomy Control")
        .body("Select an economy action")
        .button("\u00A7aGive Money", "textures/items/emerald")
        .button("\u00A7bTake Money", "textures/items/gold_nugget")
        .button("\u00A7cSet Balance", "textures/items/gold_ingot")
        .button("\u00A7eView Economy Stats", "textures/items/paper")
        .button("\u00A7fReset Economy", "textures/items/barrier")
        .button("\u00A7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
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
            player.sendMessage("\u00A77Economy stats interface coming soon...")
            await showEconomyControl(player)
            break
        case 4:
            player.sendMessage("\u00A77Reset economy interface coming soon...")
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
        player.sendMessage("\u00A7cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new Kernel.ActionFormData()
        .title("\u00A7a\u00A7e\u00A7l\u00A76\u00A7lGive Money")
        .body("Select a player to give money to")

    players.forEach(p => form.button(p.name, "textures/items/totem"))

    form.button("\u00A7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new Kernel.ModalFormData()
        .title("\u00A76\u00A7lGive Money")
        .textField("Amount:", "1000")
        .toggle("Confirm Give", false)

    const amountRes = await UIUtils.showForm(player, amountForm)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount <= 0) {
        player.sendMessage("\u00A7cInvalid amount. Must be a positive number.")
        await showEconomyControl(player)
        return
    }

    // FIX: Pass the Player Object, not target.id
    await EconomyStore.addMoney(target, amount)
    player.sendMessage(`\u00A7aSuccessfully gave $${amount} to ${target.name}.`)
    await showEconomyControl(player)
}

async function showTakeMoneyInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("\u00A7cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new Kernel.ActionFormData()
        .title("\u00A7a\u00A7e\u00A7l\u00A76\u00A7lTake Money")
        .body("Select a player to take money from")

    players.forEach(p => form.button(p.name, "textures/items/totem"))

    form.button("\u00A7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new Kernel.ModalFormData()
        .title("\u00A76\u00A7lTake Money")
        .textField("Amount:", "1000")
        .toggle("Confirm Take", false)

    const amountRes = await UIUtils.showForm(player, amountForm)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount <= 0) {
        player.sendMessage("\u00A7cInvalid amount. Must be a positive number.")
        await showEconomyControl(player)
        return
    }

    // FIX: Pass the Player Object, not target.id
    await EconomyStore.removeMoney(target, amount)
    player.sendMessage(`\u00A7aSuccessfully took $${amount} from ${target.name}.`)
    await showEconomyControl(player)
}

async function showSetBalanceInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("\u00A7cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new Kernel.ActionFormData()
        .title("\u00A7a\u00A7e\u00A7l\u00A76\u00A7lSet Balance")
        .body("Select a player to set balance for")

    players.forEach(p => form.button(p.name, "textures/items/totem"))

    form.button("\u00A7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new Kernel.ModalFormData()
        .title("\u00A76\u00A7lSet Balance")
        .textField("New Balance:", "1000")
        .toggle("Confirm Set", false)

    const amountRes = await UIUtils.showForm(player, amountForm)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount < 0) {
        player.sendMessage("\u00A7cInvalid amount. Must be a non-negative number.")
        await showEconomyControl(player)
        return
    }

    // FIX: Pass Player Object & use correct setBalance method
    await EconomyStore.setBalance(target, amount)
    player.sendMessage(`\u00A7aSuccessfully set ${target.name}'s balance to $${amount}.`)
    await showEconomyControl(player)
}

