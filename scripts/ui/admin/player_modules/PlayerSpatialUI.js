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
import { Lang } from "../../Lang.js"

export async function showHomeListUI(player, target, backCallback) {
    const HomeStore = Kernel.get("homeStore")
    const homesObj = HomeStore ? await HomeStore.getHomes(target) : {}
    const homes = Object.entries(homesObj).map(([name, data]) => ({ name, ...data }))

    if (homes.length === 0) {
        player.sendMessage(`\u00A7c\u00A7l» \u00A7e${target.name} \u00A77has no homes.`)
        await backCallback()
        return
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.GRID_L + `\u00A7e\u00A7lHomes: ${target.name}`)
        .body(`Total Waypoints: ${homes.length}`)

    homes.forEach(h => {
        form.button(`\u00A7e${h.name}\n\u00A77${Math.floor(h.x)}, ${Math.floor(h.y)}, ${Math.floor(h.z)}`)
    })
    form.button("\u00A7c<= BACK")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === homes.length) {
        await backCallback()
        return
    }

    const selectedHome = homes[res.selection]
    if (target.isValid) {
        player.teleport(selectedHome, { dimension: target.dimension })
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fTeleported to \u00A7e${target.name}'s \u00A7fhome: \u00A7e${selectedHome.name}\u00A7f.`)
    } else {
        player.sendMessage("\u00A7cTarget player is no longer online.")
    }
}

export function handleTpaToggle(player, target, PlayerStore) {
    const currentTpa = PlayerStore.get(target, "settings:tpa") !== false
    PlayerStore.set(target, "settings:tpa", !currentTpa)
    player.sendMessage(`\u00A7a\u00A7l» \u00A7fTPA for \u00A7e${target.name}\u00A7f is now ${!currentTpa ? "\u00A7aEnabled" : "\u00A7cDisabled"}\u00A7f.`)
}
