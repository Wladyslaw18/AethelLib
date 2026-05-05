/**
 * Main GUI — Central Compass Menu
 * "The Hub of Everything"
 */

import { ActionFormData } from "@minecraft/server-ui"

/**
 * Show the main compass menu
 * @param {import("@minecraft/server").Player} player
 */
export async function showMainGUI(player) {
    const form = new ActionFormData()
        .title("§0§l» §6§lAETHELGRAD MENU§0 «")
        .body("§7Select an action to continue:")
        .button("§lHOMES\n§8Teleport to coordinates", "textures/ui/map_filled")
        .button("§lWARPS\n§8World Beacons", "textures/ui/world_glyph_color")
        .button("§lPLAYERS\n§8TPA, Pay, and List", "textures/ui/multiplayer_glyph")
        .button("§lSHOP\n§8Commerce Engine", "textures/ui/shopping_cart")
        .button("§lSETTINGS\n§8Personal Config", "textures/ui/gear")

    const response = await form.show(player)
    if (response.canceled) return

    switch (response.selection) {
        case 0: {
            const { showHomeUI } = await import("./teleport/HomeUI.js")
            await showHomeUI(player)
            break
        }
        case 1: {
            const { showWarpUI } = await import("./teleport/WarpUI.js")
            await showWarpUI(player)
            break
        }
        case 2: {
            const { showPlayerUI } = await import("./player/PlayerUI.js")
            await showPlayerUI(player)
            break
        }
        case 3: {
            const { showShopUI } = await import("./shop/ShopUI.js")
            await showShopUI(player)
            break
        }
        case 4: {
            const { showSettingsUI } = await import("./settings/SettingsUI.js")
            await showSettingsUI(player)
            break
        }
    }
}
