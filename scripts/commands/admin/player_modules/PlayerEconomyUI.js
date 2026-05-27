import { Kernel } from "../../../core/Kernel.js"
import { ValidationHelper } from "../../../utils/ValidationHelper.js"
import { UIUtils } from "../../../ui/UIUtils.js"

export async function showSetMoneyUI(player, target, backCallback) {
    const economy = Kernel.get("economy")
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lSet Money")
        // @ts-ignore
        .textField("Amount:", "Enter amount")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return backCallback()

    const amountStr = String(res.formValues[0])
    const amount = Math.floor(parseFloat(amountStr))
    
    if (amount < 0 || isNaN(amount)) {
        player.sendMessage("\u00A7cInvalid amount. Balance cannot be negative or NaN.")
        return showSetMoneyUI(player, target, backCallback)
    }
    
    if (!ValidationHelper.isValidMoney(amount)) {
        player.sendMessage("\u00A7cInvalid amount. Exceeds safe boundaries.")
        return showSetMoneyUI(player, target, backCallback)
    }

    if (economy) {
        await economy.setBalance(target, amount)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fSet \u00A7e${target.name}'s \u00A7fbalance to \u00A7e$${amount.toLocaleString()}\u00A7f.`)
    }
    backCallback()
}
