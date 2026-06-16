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

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { showIndividualPlayerPanel } from "./player_modules/PlayerIndividualUI.js"
import { UIUtils } from "../UIUtils.js"

/**
 * Shows the Players List Panel
 */
export async function showPlayerManagement(player) {
    const PermissionManager = Kernel.get("permissions")
    if (!PermissionManager.hasPermission(player, "essentials.admin")) {
        player.sendMessage("\u00A7cNo permission.")
        return
    }

    const players = Kernel.world.getAllPlayers()
    const form = new Kernel.ActionFormData()
        .title("\u00A7a\u00A7e\u00A7l\u00A7e\u00A7lPlayers Panel")
        .body(`\u00A7aPlayers Online : \u00A7f${players.length}`)

    players.forEach(p => form.button(`\u00A7e\u00A7l${p.name}`, "textures/items/totem"))
    form.button("\u00A7c<= BACK", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    if (res.selection === players.length) {
        await showAdminPanel(player)
        return
    }

    await showIndividualPlayerPanel(player, players[res.selection], async () => {
        await showPlayerManagement(player)
    })
}
