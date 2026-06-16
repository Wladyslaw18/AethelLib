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
import { UIUtils } from "../../UIUtils.js"
import { ValidationHelper } from "../../../utils/ValidationHelper.js"

export async function showKickUI(player, target, backCallback) {
    if (player.id === target.id) {
        player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot kick yourself!");
        await backCallback();
        return;
    }

    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lKick Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        await backCallback()
        return
    }

    const reason = String(res.formValues[0] || "No reason provided")
    try {
        const safeName = ValidationHelper.escapeCommandString(target.name)
        const safeReason = ValidationHelper.escapeCommandString(reason)
        /* try */ Kernel.world.getDimension("overworld").runCommand(`kick "${safeName}" ${safeReason}`)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fKicked \u00A7e${target.name} \u00A7ffor: \u00A7e${reason}\u00A7f.`)
    } catch (error) {
        player.sendMessage("\u00A7cFailed to kick player.")
    }
    await backCallback()
}

export async function showBanUI(player, target, backCallback) {
    if (player.id === target.id) {
        player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot ban yourself!");
        await backCallback();
        return;
    }

    const BanManager = Kernel.get("banManager")
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lBan Player")
        // @ts-ignore
        .textField("Reason:", "No reason provided")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        await backCallback()
        return
    }

    const reason = String(res.formValues[0] || "No reason provided")
    if (BanManager) {
        BanManager.ban(target, reason, player.name)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fBanned \u00A7e${target.name} \u00A7ffor: \u00A7e${reason}\u00A7f.`)
    }
    await backCallback()
}

export async function showMuteUI(player, target, backCallback) {
    if (player.id === target.id) {
        player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot mute yourself!");
        await backCallback();
        return;
    }

    const MuteStore = Kernel.get("muteStore")
    const form = new Kernel.ModalFormData()
        .title("\u00A7e\u00A7lMute Player")
        .textField("Duration:", "e.g. 10m, 1h, or permanent", "permanent")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        await backCallback()
        return
    }

    const duration = String(res.formValues[0] || "permanent")
    if (MuteStore) {
        await MuteStore.mute(target, duration)
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fMuted \u00A7e${target.name} \u00A7ffor \u00A7e${duration}\u00A7f.`)
    }
    await backCallback()
}
