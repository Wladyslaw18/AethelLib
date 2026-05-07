import { Kernel } from "../core/Kernel.js"
import { Lang } from "./Lang.js"
import { UIUtils } from "./UIUtils.js"

/*
 * MAIN_UI_HUB
 * ----------------------------------------------------------------------------
 * Central navigation for system vectors.
 */

export async function showMainGUI(player) {
    /* 
     * DATA_ORIENTED_MANIFEST
     * Separating UI data structure from execution logic.
     */
    const menuVector = [
        {
            text: Lang.UI.HOMES_LIST,
            icon: "textures/items/map_filled",
            action: async () => {
                const { showHomeMenu } = await import("./teleport/HomeSubmenuUI.js");
                Kernel.system.run(() => showHomeMenu(player));
            }
        },
        {
            text: "§b§lWARPS\n§8Global navigation points",
            icon: "textures/items/ender_eye",
            action: async () => {
                const { showWarpUI } = await import("./teleport/WarpUI.js");
                Kernel.system.run(() => showWarpUI(player));
            }
        },
        {
            text: "§d§lPLAYERS\n§8Interact with online players",
            icon: "textures/items/totem",
            action: async () => {
                const { showPlayersUI } = await import("./social/PlayerListUI.js");
                Kernel.system.run(() => showPlayersUI(player));
            }
        },
        {
            text: "§6§lAUCTION HOUSE\n§8Global trade manifest",
            icon: "textures/blocks/chest_front",
            action: async () => {
                const { showAuctionUI } = await import("./auction/AuctionUI.js");
                Kernel.system.run(() => showAuctionUI(player));
            }
        },
        {
            text: "§a§lSHOP\n§8Industrial asset exchange",
            icon: "textures/items/emerald",
            action: async () => {
                const { showShopUI } = await import("./economy/ShopUI.js");
                Kernel.system.run(() => showShopUI(player));
            }
        },
        {
            text: "§e§lQUICK SELL\n§8Liquidate currently held asset",
            icon: "textures/items/paper",
            action: async () => {
                const { handleQuickSell } = await import("./economy/ShopTransaction.js");
                Kernel.system.run(() => handleQuickSell(player));
            }
        },
        {
            text: "§c§l[EXIT]",
            icon: "textures/ui/cancel",
            action: () => {} // NO-OP
        }
    ];

    /* 
     * RENDER_EXECUTION
     */
    const form = new Kernel.ActionFormData()
        .title(Lang.UI.MENU_TITLE)
        .body(Lang.UI.MENU_BODY);

    for (const item of menuVector) {
        form.button(item.text, item.icon);
    }

    const res = await UIUtils.showForm(player, form);
    if (res.canceled || !menuVector[res.selection]) return;

    /* 
     * ACTION_DISPATCHER
     */
    menuVector[res.selection].action();
}

