import { Kernel } from "../../core/Kernel.js";
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"
import { CommandHandler } from "../../commands/base/CommandHandler.js"

/*
 * PLAYER_INTERACTION_PROTOCOL
 */

export async function showPlayerInteractionUI(player, target) {
    const form = new Kernel.ActionFormData()
        .title(Lang.format(Lang.UI.PLAYER_DETAIL_TITLE, { name: target.name }))
        .body("Select interaction protocol.")
        .button(Lang.UI.PLAYER_PAY, "textures/items/gold_ingot")
        .button(Lang.UI.PLAYER_MSG, "textures/items/paper")
        .button(Lang.UI.PLAYER_TP, "textures/items/ender_pearl")
        .button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === 3) {
        const { showPlayersUI } = await import("./PlayerListUI.js")
        Kernel.system.run(() => showPlayersUI(player))
        return
    }

    if (target.id === player.id && res.selection < 3) {
        player.sendMessage(Lang.ERROR + "INVALID TARGET: Self-interaction restricted.")
        Kernel.system.run(() => showPlayerInteractionUI(player, target))
        return
    }

    switch (res.selection) {
        case 0: Kernel.system.run(() => showPayUI(player, target)); break
        case 1: Kernel.system.run(() => showMessageUI(player, target)); break
        case 2: 
            CommandHandler.executeCommand(player, `/ae:tpa "${target.name}"`)
            const { showPlayersUI } = await import("./PlayerListUI.js")
            Kernel.system.run(() => showPlayersUI(player))
            break
    }
}

async function showPayUI(player, target) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GOLD + "PAY")
        .textField(`Credits to ${target.name}:`, "Amount", { defaultValue: "0" })
    
    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.run(() => showPlayerInteractionUI(player, target))
        return
    }

    CommandHandler.executeCommand(player, `/ae:pay "${target.name}" ${res.formValues[0]}`)
    const { showPlayersUI } = await import("./PlayerListUI.js")
    Kernel.system.run(() => showPlayersUI(player))
}

async function showMessageUI(player, target) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GOLD + "MESSAGE")
        .textField(`To ${target.name}:`, "Message content...", { defaultValue: "" })
    
    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        Kernel.system.run(() => showPlayerInteractionUI(player, target))
        return
    }

    CommandHandler.executeCommand(player, `/ae:msg "${target.name}" ${res.formValues[0]}`)
    const { showPlayersUI } = await import("./PlayerListUI.js")
    Kernel.system.run(() => showPlayersUI(player))
}
