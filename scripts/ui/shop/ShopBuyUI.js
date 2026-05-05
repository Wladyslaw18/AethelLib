import { ModalFormData } from "@minecraft/server-ui"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"

/*
 * COMMERCE_TRANSACTION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the atomic acquisition of 
 * industrial assets. Performs a dual-phase validation handshake:
 * 1. Verification of the entity's liquidity-buffer.
 * 2. Verification of the entity's inventory-container access.
 *
 * PHILOSOPHY: Transactions must be atomic. If any phase of the acquisition 
 * vector fails, the liquidity-buffer must be restored.
 */
export async function showBuyFlow(player, item) {
    try {
        const modal = new ModalFormData()
            .title(`§6ACQUISITION: ${item.displayName}`)
            .slider("Specify unit-count for acquisition:", 1, 64, { defaultValue: 1, valueStep: 1 })

        const res = await modal.show(player)
        if (res.canceled) return

        const qty = Number(res.formValues[0])
        const total = item.price * qty
        const balance = EconomyStore.getBalance(player)

        if (balance < total) {
            player.sendMessage(`§cINSUFFICIENT_LIQUIDITY: REQUIRED_CREDITS: §e${total}§c | CURRENT_BUFFER: §e${balance}`)
            return
        }

        const success = EconomyStore.removeMoney(player, total)
        if (success) {
            const inv = player.getComponent("minecraft:inventory")?.container
            if (inv) {
                const { ItemStack } = await import("@minecraft/server")
                const itemStack = new ItemStack(item.id, qty)
                inv.addItem(itemStack)
                player.sendMessage(`§aACQUISITION_SUCCESSFUL: §e${qty}x ${item.name}§a | DEBITED: §e${total}`)
            } else {
                EconomyStore.addMoney(player, total)
                player.sendMessage("§cCONTAINER_ACCESS_FAILURE: TRANSACTION_REFUNDED")
            }
        } else {
            player.sendMessage("§cCOMMERCE_TRANSACTION_FAILURE: SYSTEM_REJECTION")
        }
    } catch (error) {
        console.error(`[ShopBuyUI] TRANSACTION_COLLAPSE: ${error}`)
        player.sendMessage("§cCOMMERCE_TRANSACTION_FAILURE: FATAL_SYSTEM_ERROR")
    }
}
