import { ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../../core/Kernel.js"
import { ValidationHelper } from "../../../utils/ValidationHelper.js"

export async function showSetMoneyUI(player, target, backCallback) {
    const economy = Kernel.get("economy")
    const form = new ModalFormData()
        .title("§e§lSet Money")
        // @ts-ignore
        .textField("Amount:", "Enter amount")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const amountStr = String(res.formValues[0])
    const amount = Math.floor(parseFloat(amountStr))
    
    if (amount < 0 || isNaN(amount)) {
        player.sendMessage("§cInvalid amount. Balance cannot be negative or NaN.")
        return showSetMoneyUI(player, target, backCallback)
    }
    
    if (!ValidationHelper.isValidMoney(amount)) {
        player.sendMessage("§cInvalid amount. Exceeds safe boundaries.")
        return showSetMoneyUI(player, target, backCallback)
    }

    if (economy) {
        economy.setBalance(target, amount)
        player.sendMessage(`§a§l» §fSet §e${target.name}'s §fbalance to §e$${amount.toLocaleString()}§f.`)
    }
    backCallback()
}
