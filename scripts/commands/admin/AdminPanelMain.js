/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  [ NOBLE INFRASTRUCTURE CORE ]
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Kernel } from "../../core/Kernel.js"

// Proxy function to satisfy relative imports from other legacy commands files
export async function showAdminPanel(player) {
    const { showAdminPanel: showUI } = await import("../../ui/admin/AdminPanelMain.js")
    return showUI(player)
}

// ----------------------------------------------------------------------------
// | object: AdminPanelCommand                                                |
// | command definition for opening the main administrative interface.         |
// ----------------------------------------------------------------------------
export const AdminPanelCommand = {
    // internal name of the command.
    name: "adminpanel",
    // alternative names that trigger the same logic.
    aliases: ["ap", "admin", "panel"],
    // human-readable explanation of what it does.
    description: "Open admin control panel",
    // how to use it.
    usage: "/ae:adminpanel",
    // permission node required to execute this command.
    permission: "essentials.admin",
    // category for organization in /help.
    category: "admin",

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | the entry point when the command is run.                                 |
    // ----------------------------------------------------------------------------
    async execute(_data, player, _args) {
        // route to the unified UI main panel.
        Kernel.system.run(() => showAdminPanel(player))
    }
}
