import { ModalFormData } from "@minecraft/server-ui"
import { Kernel } from "../../../core/Kernel.js"
import { ValidationHelper } from "../../../utils/ValidationHelper.js"

export async function showSetMoneyUI(player, target, backCallback) {
    const economy = Kernel.get("economy")
    const form = new ModalFormData()
        .title("\xA7e\xA7lSet Money")
        // @ts-ignore
        .textField("Amount:", "Enter amount")

    const res = await form.show(player)
    if (res.canceled) return backCallback()

    const amountStr = String(res.formValues[0])
    const amount = Math.floor(parseFloat(amountStr))
    
    if (amount < 0 || isNaN(amount)) {
        player.sendMessage("\xA7cInvalid amount. Balance cannot be negative or NaN.")
        return showSetMoneyUI(player, target, backCallback)
    }
    
    if (!ValidationHelper.isValidMoney(amount)) {
        player.sendMessage("\xA7cInvalid amount. Exceeds safe boundaries.")
        return showSetMoneyUI(player, target, backCallback)
    }

    if (economy) {
        economy.setBalance(target, amount)
        player.sendMessage(`\xA7a\xA7l» \xA7fSet \xA7e${target.name}'s \xA7fbalance to \xA7e$${amount.toLocaleString()}\xA7f.`)
    }
    backCallback()
}
