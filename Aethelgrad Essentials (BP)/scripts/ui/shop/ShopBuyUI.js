/**
 * Shop Buy UI - Phase 4: Purchase flow with quantity selection
 */

import { ModalFormData } from "@minecraft/server-ui"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

export async function showBuyFlow(player, item) {
    try {
        const modal = new ModalFormData()
            .title(`§6Buy ${item.displayName}`)
            .slider("Quantity", 1, 64, 1, 1)

        const res = await modal.show(player)
        if (res.canceled) return

        const qty = res.formValues[0]
        const total = item.price * qty
        const balance = EconomyStore.getBalance(player)

        if (balance < total) {
            player.sendMessage(`§cNeed §e${total}§c, have §e${balance}`)
            return
        }

        // Process purchase
        const success = EconomyStore.removeMoney(player, total)
        if (success) {
            const inv = player.getComponent("minecraft:inventory")?.container
            if (inv) {
                const { ItemStack } = await import("@minecraft/server")
                const itemStack = new ItemStack(item.id, qty)
                inv.addItem(itemStack)
                player.sendMessage(`§aBought §e${qty}x ${item.displayName} §afor §e${total}`)
            } else {
                // Refund if inventory not accessible
                EconomyStore.addMoney(player, total)
                player.sendMessage("§cFailed to access inventory, refunded")
            }
        } else {
            player.sendMessage("§cPurchase failed")
        }
    } catch (error) {
        console.error(`Buy flow error: ${error}`)
        player.sendMessage("§cPurchase failed")
    }
}
