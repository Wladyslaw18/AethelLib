import { Kernel } from "../../core/Kernel.js";
import { HomeStore } from "../../systems/teleport/HomeStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * HOME_ACTION_INTERFACE
 */

export async function showCreateHomeUI(player) {
    const form = new Kernel.ModalFormData()
        .title(Lang.GOLD + "SET HOME")
        .textField("Anchor Name:", "e.g. Base 1", { defaultValue: "Home" })
    
    const res = await UIUtils.showForm(player, form)
    if (res.canceled) {
        const { showHomeMenu } = await import("./HomeSubmenuUI.js")
        Kernel.system.run(() => showHomeMenu(player))
        return
    }

    const name = res.formValues[0]
    if (!name || name.trim().length === 0) {
        player.sendMessage(Lang.ERROR + "INVALID NAME: Anchor requires a label.")
        Kernel.system.run(() => showCreateHomeUI(player))
        return
    }

    const success = await HomeStore.setHome(player, name, player.location, player.dimension.id)
    player.sendMessage(success 
        ? Lang.SUCCESS + `ANCHOR SET: ${name.toUpperCase()} localized.`
        : Lang.ERROR + "ANCHOR FAILURE: Limit reached or Kernel.system error.")

    const { showHomeMenu } = await import("./HomeSubmenuUI.js")
    Kernel.system.run(() => showHomeMenu(player))
}

export async function showDeleteHomeUI(player) {
    const homes = await HomeStore.getHomes(player)
    const homeNames = Object.keys(homes)

    if (homeNames.length === 0) {
        player.sendMessage(Lang.ERROR + "NO NODES: No anchors found.")
        const { showHomeMenu } = await import("./HomeSubmenuUI.js")
        Kernel.system.run(() => showHomeMenu(player))
        return
    }

    const form = new Kernel.ActionFormData()
        .title(Lang.ERROR + "DELETE HOME")
        .body("Select node to purge.")

    homeNames.forEach(name => form.button(`\xA7c\xA7l${name.toUpperCase()}`, "textures/ui/cancel"))
    form.button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === homeNames.length) {
        const { showHomeMenu } = await import("./HomeSubmenuUI.js")
        Kernel.system.run(() => showHomeMenu(player))
        return
    }

    const selected = homeNames[res.selection]
    const success = await HomeStore.deleteHome(player, selected)
    player.sendMessage(success 
        ? Lang.SUCCESS + `PURGED: Anchor ${selected} removed.`
        : Lang.ERROR + `FAILURE: Could not purge ${selected}.`)
    
    const { showHomeMenu } = await import("./HomeSubmenuUI.js")
    Kernel.system.run(() => showHomeMenu(player))
}
