import { Kernel } from "../core/Kernel.js"
import { Lang } from "./Lang.js"
import { UIUtils } from "./UIUtils.js"

/*
 * MAIN_UI_HUB
 * ----------------------------------------------------------------------------
 * Central navigation for system vectors.
 */

export async function showMainGUI(player) {
    const form = new Kernel.ActionFormData()
        .title(Lang.UI.MENU_TITLE)
        .body(Lang.UI.MENU_BODY)
        .button(Lang.UI.HOMES_LIST, "textures/items/map_filled")
        .button("§b§lWARPS\n§8Global navigation points", "textures/items/ender_eye")
        .button("§d§lPLAYERS\n§8Interact with online players", "textures/items/totem")
        .button("§6§lAUCTION HOUSE\n§8Global trade manifest", "textures/blocks/chest_front")
        .button("§a§lSHOP\n§8Industrial asset exchange", "textures/items/emerald")
        .button("§e§lQUICK SELL\n§8Liquidate currently held asset", "textures/items/paper")
        .button("§c§l[EXIT]", "textures/ui/cancel")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === 6) return

    switch (res.selection) {
        case 0: {
            const { showHomeMenu } = await import("./teleport/HomeSubmenuUI.js")
            Kernel.system.run(() => showHomeMenu(player)); 
            break
        }
        case 1: {
            const { showWarpUI } = await import("./teleport/WarpUI.js")
            Kernel.system.run(() => showWarpUI(player)); 
            break
        }
        case 2: {
            const { showPlayersUI } = await import("./social/PlayerListUI.js")
            Kernel.system.run(() => showPlayersUI(player)); 
            break
        }
        case 3: {
            const { showAuctionUI } = await import("./auction/AuctionUI.js")
            Kernel.system.run(() => showAuctionUI(player)); 
            break
        }
        case 4: {
            const { showShopUI } = await import("./economy/ShopUI.js")
            Kernel.system.run(() => showShopUI(player)); 
            break
        }
        case 5: {
            const { handleQuickSell } = await import("./economy/ShopTransaction.js")
            Kernel.system.run(() => handleQuickSell(player)); 
            break
        }
    }
}

