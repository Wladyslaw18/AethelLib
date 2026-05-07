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
        .title("§6Buy: " + item.name.toUpperCase())
        .slider(`§7Select Quantity\n§8Unit Price: §a$${item.buy}\n§8Balance: §a$${balance.toLocaleString()}`, 1, 64, { valueStep: 1, defaultValue: 1 })
        .toggle("Confirm Purchase", { defaultValue: false })

    
    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    const [amount, confirm] = res.formValues
    if (!confirm) return

    await ShopService.buy(player, item, amount)
    system.run(() => showShopUI(player))
}

export async function showSellConfirmation(player, item) {
    const form = new ModalFormData()
        .title("§6Sell: " + item.name.toUpperCase())
        .slider(`§7Select Quantity\n§8Unit Value: §c$${item.sell}`, 1, 64, { valueStep: 1, defaultValue: 1 })
        .toggle("Confirm Sale", { defaultValue: false })

    
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
        player.sendMessage("§c§l» §7Your main hand is empty.")
        return
    }


    const shopItem = ShopStore.getItems().find(i => i.id === mainhand.typeId)
    if (!shopItem) {
        player.sendMessage("§c§l» §7This item cannot be sold here.")
        return
    }


    system.run(() => showSellConfirmation(player, shopItem))
}

