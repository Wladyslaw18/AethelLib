import { Kernel } from "../../core/Kernel.js";
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { UIUtils } from "../UIUtils.js"

/*
 * Shop Buy Flow
 * ----------------------------------------------------------------------------
 * Handles the UI and logic for buying items from the shop.
 */

export async function showBuyFlow(player, item) {
    try {
        const modal = new Kernel.ModalFormData()
            .title(`\u00A76Purchase: ${item.displayName}`)
            .slider("Amount to buy:", 1, 64, 1, 1)


        const res = await UIUtils.showForm(player, modal)
        if (res.canceled) return

        const qty = Number(res.formValues[0])
        const total = item.price * qty
        const balance = EconomyStore.getBalance(player)

        if (balance < total) {
            player.sendMessage(`\u00A7c\u00A7l» \u00A77You don't have enough money! (\u00A7e$${total}\u00A77)`)
            return
        }


        const success = EconomyStore.removeMoney(player, total)
        if (success) {
            const inv = player.getComponent(Kernel.EntityComponentTypes.Inventory)?.container
            if (inv) {
                const { ItemStack } = Kernel
                const itemStack = new ItemStack(item.id, qty)
                inv.addItem(itemStack)
                player.sendMessage(`\u00A7a\u00A7l» \u00A7fPurchased \u00A7e${qty}x ${item.name} \u00A7ffor \u00A7a$${total}\u00A7f.`)

            } else {
                EconomyStore.addMoney(player, total)
                player.sendMessage("\u00A7c\u00A7l» \u00A77Failed to access inventory. Refunded.")
            }
        } else {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Transaction failed.")
        }

    } catch (error) {
        console.error(`[ShopBuyUI] TRANSACTION_CRASH: ${error}`)
        player.sendMessage("\u00A7c\u00A7l» \u00A77Transaction failed.")
    }

}


