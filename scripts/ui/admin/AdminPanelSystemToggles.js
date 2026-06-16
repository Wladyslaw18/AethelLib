/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  [ NOBLE INFRASTRUCTURE CORE  • 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { Kernel } from "../../core/Kernel.js"
import { showAdminPanel } from "./AdminPanelMain.js"
import { SettingsStore } from "../../core/store/SettingsStore.js"
import { UIUtils } from "../UIUtils.js"

const SYSTEMS = [
    { key: "moneySystem",   label: "Economy System" },
    { key: "homeSystem",    label: "Home System" },
    { key: "tpaSystem",     label: "TPA System" },
    { key: "warpSystem",    label: "Warp System" },
    { key: "backSystem",    label: "Back Command" },
    { key: "rtpSystem",     label: "Random Teleport (RTP)" },
    { key: "shopSystem",    label: "Chest Shop System" },
    { key: "sellSystem",    label: "Quick Sell" },
    { key: "auctionSystem", label: "Auction House" },
    { key: "withdrawSystem",label: "Banknote Withdraw" },
    { key: "messageSystem", label: "Private Messages" },
    { key: "landSystem",    label: "Land Claims" }
];

export async function showSystemToggles(player) {
    const settings = SettingsStore.getAll();

    const form = new Kernel.ModalFormData()
        .title("§e§lSYSTEM TOGGLES");

    for (const sys of SYSTEMS) {
        form.toggle(sys.label, settings[sys.key] !== false);
    }

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) return;

    SYSTEMS.forEach((sys, idx) => {
        settings[sys.key] = res.formValues[idx];
    });

    SettingsStore.updateAll(settings);

    // Enable/disable the actual Kernel systems to match
    for (const sys of SYSTEMS) {
        if (settings[sys.key] === false) {
            Kernel.disableSystem(sys.key);
        } else {
            Kernel.enableSystem(sys.key);
        }
    }

    player.sendMessage("§a§l» §fSystem toggles updated.");
    await showAdminPanel(player);
}
