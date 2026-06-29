import { ModalFormData } from "@minecraft/server-ui"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

/*
 * Shop Buy Flow
 * ----------------------------------------------------------------------------
 * Handles the UI and logic for buying items from the shop.
 */

export async function showBuyFlow(player, item) {
    try {
        const modal = new ModalFormData()
            .title(`§6Purchase: ${item.displayName}`)
            .slider("Amount to buy:", 1, 64, { defaultValue: 1, valueStep: 1 })


        const res = await modal.show(player)
        if (res.canceled) return

        const qty = Number(res.formValues[0])
        const total = item.price * qty
        const balance = EconomyStore.getBalance(player)

        if (balance < total) {
            player.sendMessage(`§c§l» §7You don't have enough money! (§e$${total}§7)`)
            return
        }


        const success = EconomyStore.removeMoney(player, total)
        if (success) {
            const inv = player.getComponent("minecraft:inventory")?.container
            if (inv) {
                const { ItemStack } = await import("@minecraft/server")
                const itemStack = new ItemStack(item.id, qty)
                inv.addItem(itemStack)
                player.sendMessage(`§a§l» §fPurchased §e${qty}x ${item.name} §ffor §a$${total}§f.`)

            } else {
                EconomyStore.addMoney(player, total)
                player.sendMessage("§c§l» §7Failed to access inventory. Refunded.")
            }
        } else {
            player.sendMessage("§c§l» §7Transaction failed.")
        }

    } catch (error) {
        console.error(`[ShopBuyUI] TRANSACTION_CRASH: ${error}`)
        player.sendMessage("§c§l» §7Transaction failed.")
    }

}
