/**
 * Admin Panel Economy - Economy control sub-panel
 */

import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { UIUtils } from "../../ui/UIUtils.js"

/** @typedef {import("@minecraft/server").Player} Player */

export async function showEconomyControl(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\xA7cNo permission.")
        return
    }
    const form = new ActionFormData()
        .title("\xA7a\xA7e\xA7m\xA76\xA7lEconomy Control")
        .body("Select an economy action")
        .button("\xA7aGive Money", "textures/items/emerald")
        .button("\xA7bTake Money", "textures/items/gold_nugget")
        .button("\xA7cSet Balance", "textures/items/gold_ingot")
        .button("\xA7eView Economy Stats", "textures/items/paper")
        .button("\xA7fReset Economy", "textures/items/barrier")
        .button("\xA7cBack", "textures/ui/refresh")

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
            player.sendMessage("\xA77Economy stats interface coming soon...")
            await showEconomyControl(player)
            break
        case 4:
            player.sendMessage("\xA77Reset economy interface coming soon...")
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
        player.sendMessage("\xA7cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new ActionFormData()
        .title("\xA7a\xA7e\xA7l\xA76\xA7lGive Money")
        .body("Select a player to give money to")

    players.forEach(p => form.button(p.name, "textures/items/totem"))

    form.button("\xA7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new ModalFormData()
        .title("\xA76\xA7lGive Money")
        .textField("Amount:", "1000")
        .toggle("Confirm Give", { defaultValue: false })

    const amountRes = await UIUtils.showForm(player, amountForm)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount <= 0) {
        player.sendMessage("\xA7cInvalid amount. Must be a positive number.")
        await showEconomyControl(player)
        return
    }

    EconomyStore.addMoney(target.id, amount)
    player.sendMessage(`\xA7aSuccessfully gave $${amount} to ${target.name}.`)
    await showEconomyControl(player)
}

async function showTakeMoneyInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("\xA7cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new ActionFormData()
        .title("\xA7a\xA7e\xA7l\xA76\xA7lTake Money")
        .body("Select a player to take money from")

    players.forEach(p => form.button(p.name, "textures/items/totem"))

    form.button("\xA7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new ModalFormData()
        .title("\xA76\xA7lTake Money")
        .textField("Amount:", "1000")
        .toggle("Confirm Take", { defaultValue: false })

    const amountRes = await UIUtils.showForm(player, amountForm)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount <= 0) {
        player.sendMessage("\xA7cInvalid amount. Must be a positive number.")
        await showEconomyControl(player)
        return
    }

    EconomyStore.removeMoney(target.id, amount)
    player.sendMessage(`\xA7aSuccessfully took $${amount} from ${target.name}.`)
    await showEconomyControl(player)
}

async function showSetBalanceInterface(player) {
    const players = Kernel.world.getAllPlayers()
    if (players.length === 0) {
        player.sendMessage("\xA7cNo players online")
        await showEconomyControl(player)
        return
    }

    const form = new ActionFormData()
        .title("\xA7a\xA7e\xA7l\xA76\xA7lSet Balance")
        .body("Select a player to set balance for")

    players.forEach(p => form.button(p.name, "textures/items/totem"))

    form.button("\xA7cBack", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === players.length) {
        await showEconomyControl(player)
        return
    }

    const target = players[res.selection]
    
    const amountForm = new ModalFormData()
        .title("\xA76\xA7lSet Balance")
        .textField("New Balance:", "1000")
        .toggle("Confirm Set", { defaultValue: false })

    const amountRes = await UIUtils.showForm(player, amountForm)
    if (amountRes.canceled || !amountRes.formValues[1]) {
        await showEconomyControl(player)
        return
    }

    const amount = Math.floor(Number(amountRes.formValues[0]))
    if (isNaN(amount) || amount < 0) {
        player.sendMessage("\xA7cInvalid amount. Must be a non-negative number.")
        await showEconomyControl(player)
        return
    }

    EconomyStore.setMoney(target.id, amount)
    player.sendMessage(`\xA7aSuccessfully set ${target.name}'s balance to $${amount}.`)
    await showEconomyControl(player)
}

