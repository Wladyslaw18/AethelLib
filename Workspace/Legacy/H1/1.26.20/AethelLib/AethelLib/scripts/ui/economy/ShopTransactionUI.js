import { ModalFormData } from "@minecraft/server-ui"
import { EntityComponentTypes, system } from "@minecraft/server"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { ShopStore } from "../../systems/economy/ShopStore.js"
import { ShopService } from "../../systems/economy/ShopService.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { showShopUI } from "./ShopUI.js"

/*
 * SHOP_TRANSACTION_ENGINE
 */

export async function showBuyConfirmation(player, item) {
    const balance = await EconomyStore.getBalance(player)
    
    const form = new ModalFormData()
        .title(Lang.GOLD + "ACQUIRE: " + item.name.toUpperCase())
        .slider(`\u00A77Select Quantity\n\u00A78Unit Price: \u00A7a$${item.buy}\n\u00A78Liquidity: \u00A7a$${balance.toLocaleString()}`, 1, 64, { defaultValue: 1, valueStep: 1 })
        .toggle("Confirm Transaction", { defaultValue: false })
    
    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    const [amount, confirm] = res.formValues
    if (!confirm) return

    await ShopService.buy(player, item, amount)
    system.run(() => showShopUI(player))
}

export async function showSellConfirmation(player, item) {
    const form = new ModalFormData()
        .title(Lang.GOLD + "LIQUIDATE: " + item.name.toUpperCase())
        .slider(`\u00A77Select Quantity\n\u00A78Unit Value: \u00A7c$${item.sell}`, 1, 64, { defaultValue: 1, valueStep: 1 })
        .toggle("Confirm Liquidation", { defaultValue: false })
    
    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    const [amount, confirm] = res.formValues
    if (!confirm) return

    await ShopService.sell(player, item, amount)
    system.run(() => showShopUI(player))
}

export async function handleQuickSell(player) {
    const equippable = player.getComponent(EntityComponentTypes.Equippable)
    const mainhand = equippable.getEquipment("Mainhand")

    if (!mainhand) {
        player.sendMessage(Lang.ERROR + "VOID: Mainhand is empty.")
        return
    }

    const shopItem = ShopStore.getItems().find(i => i.id === mainhand.typeId)
    if (!shopItem) {
        player.sendMessage(Lang.ERROR + "UNTRADABLE: Asset not found in manifest.")
        return
    }

    system.run(() => showSellConfirmation(player, shopItem))
}
