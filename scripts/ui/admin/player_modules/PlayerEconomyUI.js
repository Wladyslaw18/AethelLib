/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *  
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.
 *  
 *  [ NOBLE INFRASTRUCTURE CORE  • 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Kernel } from "../../../core/Kernel.js"
import { ValidationHelper } from "../../../utils/ValidationHelper.js"
import { UIUtils } from "../../UIUtils.js"

export async function showSetMoneyUI(player, target, backCallback) {
    const economy = Kernel.get("economy")
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lSet Money")
        // @ts-ignore
        .textField("Amount:", "Enter amount")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        await backCallback()
        return
    }

    const amountStr = String(res.formValues[0])
    const amount = Math.floor(parseFloat(amountStr))
    
    if (amount < 0 || isNaN(amount)) {
        player.sendMessage("\u00A7cInvalid amount. Balance cannot be negative or NaN.")
        await showSetMoneyUI(player, target, backCallback)
        return
    }
    
    if (!ValidationHelper.isValidMoney(amount)) {
        player.sendMessage("\u00A7cInvalid amount. Exceeds safe boundaries.")
        await showSetMoneyUI(player, target, backCallback)
        return
    }

    if (economy) {
        await economy.setBalance(target, amount)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fSet \u00A7e${target.name}'s \u00A7fbalance to \u00A7e$${amount.toLocaleString()}\u00A7f.`)
    }
    await backCallback()
}