import { Kernel } from "../../core/Kernel.js";
import { UIUtils } from "../UIUtils.js";
import { TPAStore } from "../../systems/tpa/TpaStore.js";

/*
 * TpaSettingsUI
 * ----------------------------------------------------------------------------
 * Interactive TPA Settings and Blocklist management.
 */

export async function showTpaSettingsUI(player) {
    const tpaEnabled = TPAStore.isEnabled(player.id);
    const popupEnabled = TPAStore.getUIToggle(player.id);

    const form = new Kernel.ActionFormData()
        .title("\u00A76\u00A7lTPA SETTINGS")
        .body("\u00A77Configure your teleport request preferences.")
        .button(`\u00A7eTPA Requests: ${tpaEnabled ? "\u00A7a\u00A7lENABLED" : "\u00A7c\u00A7lDISABLED"}`, "textures/ui/world_glyph")
        .button(`\u00A7eRequest Popup: ${popupEnabled ? "\u00A7a\u00A7lENABLED" : "\u00A7c\u00A7lDISABLED"}`, "textures/ui/sidebar_icons/chat")
        .button("\u00A7bManage Blocked Players", "textures/ui/warning_glyph")
        .button("\u00A7cBACK", "textures/ui/refresh");

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) return;

    switch (res.selection) {
        case 0:
            TPAStore.setEnabled(player.id, !tpaEnabled);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fTPA requests are now ${!tpaEnabled ? "\u00A7aenabled" : "\u00A7cdisabled"}\u00A7f.`);
            Kernel.system.runTimeout(() => showTpaSettingsUI(player), 5);
            break;
        case 1:
            TPAStore.setUIToggle(player.id, !popupEnabled);
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fRequest popups are now ${!popupEnabled ? "\u00A7aenabled" : "\u00A7cdisabled"}\u00A7f.`);
            Kernel.system.runTimeout(() => showTpaSettingsUI(player), 5);
            break;
        case 2:
            Kernel.system.runTimeout(() => showBlockedPlayersUI(player), 5);
            break;
        case 3:
            const { MainGUI } = await import("../MainGUI.js");
            Kernel.system.runTimeout(() => {
                MainGUI.showMainMenu(player);
            }, 5);
            break;
    }
}

async function showBlockedPlayersUI(player) {
    const blockedIds = TPAStore.getBlocked(player.id);
    const form = new Kernel.ActionFormData()
        .title("\u00A76\u00A7lBLOCKED PLAYERS")
        .body("\u00A77Below is the list of players you have blocked. Click a player to unblock them.");

    const blockedList = [];
    const Database = Kernel.get("database");
    for (const targetId of blockedIds) {
        let name = "Unknown Player";
        if (Database) {
            name = Database.get(`player:${targetId}:name`) || name;
        } else {
            const onlinePlayer = Kernel.world.getAllPlayers().find(p => p.id === targetId);
            if (onlinePlayer) name = onlinePlayer.name;
        }
        blockedList.push({ id: targetId, name });
    }

    for (const entry of blockedList) {
        form.button(`\u00A7cUnblock: \u00A7f${entry.name}`, "textures/ui/delete");
    }
    form.button("\u00A7a+ Block a Player", "textures/ui/plus");
    form.button("\u00A7cBACK", "textures/ui/refresh");

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) return showTpaSettingsUI(player);

    if (res.selection === blockedList.length) {
        Kernel.system.runTimeout(() => showBlockPlayerModal(player), 5);
    } else if (res.selection === blockedList.length + 1) {
        Kernel.system.runTimeout(() => showTpaSettingsUI(player), 5);
    } else {
        const selected = blockedList[res.selection];
        TPAStore.unblockPlayer(player.id, selected.id);
        player.sendMessage(`\u00A7a\u00A7l» \u00A7fSuccessfully unblocked \u00A7e${selected.name}\u00A7f.`);
        Kernel.system.runTimeout(() => showBlockedPlayersUI(player), 5);
    }
}

async function showBlockPlayerModal(player) {
    const form = new Kernel.ModalFormData()
        .title("\u00A76\u00A7lBLOCK A PLAYER")
        .textField("Player Name to Block:", "Enter name here");

    const res = await UIUtils.showForm(player, form);
    if (res.canceled) return showBlockedPlayersUI(player);

    const nameToBlock = res.formValues[0]?.trim();
    if (!nameToBlock) {
        player.sendMessage("\u00A7c\u00A7l» \u00A77Invalid name.");
        return showBlockedPlayersUI(player);
    }

    const { PlayerUtils } = await import("../../utils/PlayerUtils.js");
    const targetId = PlayerUtils.getIdByName(nameToBlock);

    if (!targetId) {
        player.sendMessage(`\u00A7c\u00A7l» \u00A77Could not find a player named "\u00A7e${nameToBlock}\u00A77".`);
        return showBlockedPlayersUI(player);
    }

    if (targetId === player.id) {
        player.sendMessage("\u00A7c\u00A7l» \u00A77You cannot block yourself!");
        return showBlockedPlayersUI(player);
    }

    TPAStore.blockPlayer(player.id, targetId);
    player.sendMessage(`\u00A7a\u00A7l» \u00A7fSuccessfully blocked \u00A7e${nameToBlock}\u00A7f.`);
    Kernel.system.runTimeout(() => showBlockedPlayersUI(player), 5);
}
