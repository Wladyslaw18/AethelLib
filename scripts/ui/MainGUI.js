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
            text: "\u00A7b\u00A7lWARPS\n\u00A78Global navigation points",
            icon: "textures/items/ender_eye",
            action: async () => {
                const { showWarpUI } = await import("./teleport/WarpUI.js");
                Kernel.system.run(() => showWarpUI(player));
            }
        },
        {
            text: "\u00A7d\u00A7lPLAYERS\n\u00A78Interact with online players",
            icon: "textures/items/totem",
            action: async () => {
                const { showPlayersUI } = await import("./social/PlayerListUI.js");
                Kernel.system.run(() => showPlayersUI(player));
            }
        },
        {
            text: "\u00A76\u00A7lAUCTION HOUSE\n\u00A78Global trade manifest",
            icon: "textures/blocks/chest_front",
            action: async () => {
                const { showAuctionUI } = await import("./auction/AuctionUI.js");
                Kernel.system.run(() => showAuctionUI(player));
            }
        },
        {
            text: "\u00A7a\u00A7lSHOP\n\u00A78Industrial asset exchange",
            icon: "textures/items/emerald",
            action: async () => {
                const { showShopUI } = await import("./economy/ShopUI.js");
                Kernel.system.run(() => showShopUI(player));
            }
        },
        {
            text: "\u00A7e\u00A7lQUICK SELL\n\u00A78Liquidate currently held asset",
            icon: "textures/items/paper",
            action: async () => {
                const { handleQuickSell } = await import("./economy/ShopTransaction.js");
                Kernel.system.run(() => handleQuickSell(player));
            }
        },
        {
            text: "\u00A7c\u00A7l[EXIT]",
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

