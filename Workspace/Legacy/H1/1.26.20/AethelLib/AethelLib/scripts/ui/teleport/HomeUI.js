import { ActionFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
import { Kernel } from "../../core/Kernel.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * HOME_UI_CONTROLLER
 * ----------------------------------------------------------------------------
 * Handles spatial anchor navigation and management.
 */

export async function showHomeUI(player) {
    const HomeStore = Kernel.get("homeStore")
    const homes = await HomeStore.getHomes(player)
    const homeNames = Object.keys(homes)

    const form = new ActionFormData()
        .title(Lang.UI.HOMES_TITLE)
        .body(homeNames.length > 0
            ? `§7Active Anchors: §e${homeNames.length}`
            : "§cNO HOMES FOUND.")

    form.button("§c§l[BACK]", "textures/ui/refresh")

    for (const name of homeNames) {
        const home = homes[name]
        form.button(`§f§l${name.toUpperCase()}\n§8COORD: ${Math.floor(home.x)}, ${Math.floor(home.y)}, ${Math.floor(home.z)}`, "textures/items/map_filled")
    }

    const response = await UIUtils.showForm(player, form)
    if (response.canceled) return

    if (response.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        system.run(() => showMainGUI(player))
        return
    }

    const selectedIndex = response.selection - 1
    const selectedName = homeNames[selectedIndex]
    if (!selectedName) return

    system.run(() => showHomeActions(player, selectedName, homes[selectedName]))
}

async function showHomeActions(player, name, home) {
    const form = new ActionFormData()
        .title(Lang.GOLD + "DETAILS: " + name.toUpperCase())
        .body(`§7Target: §e${Math.floor(home.x)}, ${Math.floor(home.y)}, ${Math.floor(home.z)}\n§7Dim: §e${home.dimension}`)
        .button("§a§lTELEPORT\n§8Relocate to anchor", "textures/items/ender_pearl")
        .button("§c§lDELETE\n§8Remove anchor", "textures/ui/cancel")
        .button("§7§l[BACK]", "textures/ui/refresh")

    const response = await UIUtils.showForm(player, form)
    if (response.canceled) return

    switch (response.selection) {
        case 0: {
            Kernel.system.run(() => {
                try {
                    const targetDim = Kernel.world.getDimension(home.dimension)
                    player.teleport(
                        { x: home.x + 0.5, y: home.y, z: home.z + 0.5 },
                        { dimension: targetDim }
                    )
                    player.sendMessage(Lang.SUCCESS + `TELEPORTED: Arrived at ${name}.`);
                } catch (error) {
                    player.sendMessage(Lang.ERROR + "TELEPORT FAILURE.");
                }
            })
            break
        }
        case 1: {
            const HomeStore = Kernel.get("homeStore")
            const success = await HomeStore.deleteHome(player, name)
            player.sendMessage(success
                ? Lang.SUCCESS + `DELETED: Anchor ${name} removed.`
                : Lang.ERROR + "DELETE FAILURE.");
            system.run(() => showHomeUI(player))
            break
        }
        case 2: {
            system.run(() => showHomeUI(player))
            break
        }
    }
}

