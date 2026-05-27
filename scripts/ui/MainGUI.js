import { Kernel } from "../core/Kernel.js"
import { Lang } from "./Lang.js"
import { UIUtils } from "./UIUtils.js"
import { showWarpUI } from "./teleport/WarpUI.js"

/*
 * MAIN_UI_HUB
 * ----------------------------------------------------------------------------
 * Central navigation for system vectors.
 */

export async function showMainGUI(player) {
    const SettingsStore = Kernel.get("settings");
    const menuVector = [];

    // Homes Subsystem
    if (!SettingsStore || SettingsStore.get("homeSystem")) {
        menuVector.push({
            text: Lang.UI.HOMES_LIST || "\u00A7a\u00A7lHOMES\n\u00A78Manage and teleport to anchors",
            icon: "textures/items/map_filled",
            action: async () => {
                const { showHomeUI } = await import("./teleport/HomeUI.js");
                Kernel.system.run(() => showHomeUI(player));
            }
        });
    }

    // Warps Subsystem
    if (!SettingsStore || SettingsStore.get("warpSystem")) {
        menuVector.push({
            text: "\u00A7b\u00A7lWARPS\n\u00A78Global navigation points",
            icon: "textures/items/ender_eye",
            action: () => {
                Kernel.system.run(() => showWarpUI(player, showMainGUI));
            }
        });
    }
    
    // Shop Subsystem
    if (!SettingsStore || SettingsStore.get("shopSystem")) {
        menuVector.push({
            text: "\u00A7a\u00A7lSHOP\n\u00A78Industrial asset exchange",
            icon: "textures/items/emerald",
            action: async () => {
                const { showShopUI } = await import("./economy/ShopUI.js");
                Kernel.system.run(() => showShopUI(player));
            }
        });
    }

    // Quick Sell Subsystem
    if (!SettingsStore || SettingsStore.get("sellSystem")) {
        menuVector.push({
            text: "\u00A7e\u00A7lQUICK SELL\n\u00A78Liquidate currently held asset",
            icon: "textures/items/paper",
            action: async () => {
                const { handleQuickSell } = await import("./economy/ShopTransaction.js");
                Kernel.system.run(() => handleQuickSell(player));
            }
        });
    }

    // Auction Subsystem
    if (!SettingsStore || SettingsStore.get("auctionSystem")) {
        menuVector.push({
            text: "\u00A76\u00A7lAUCTION HOUSE\n\u00A78Global trade manifest",
            icon: "textures/blocks/chest_front",
            action: async () => {
                const { showAuctionUI } = await import("./auction/AuctionUI.js");
                Kernel.system.run(() => showAuctionUI(player));
            }
        });
    }

    // Economy Subsystem
    if (!SettingsStore || SettingsStore.get("moneySystem")) {
        menuVector.push({
            text: "\u00A76\u00A7lECONOMY\n\u00A78Check balance, pay, withdraw",
            icon: "textures/ui/pay",
            action: async () => {
                const { showEconomyMenu } = await import("./economy/EconomyUI.js");
                Kernel.system.run(() => showEconomyMenu(player));
            }
        });
    }

    // Social/Players Hub
    menuVector.push({
        text: "\u00A7d\u00A7lPLAYERS\n\u00A78Interact with online players",
        icon: "textures/items/totem",
        action: async () => {
            const { showPlayersUI } = await import("./social/PlayerListUI.js");
            Kernel.system.run(() => showPlayersUI(player));
        }
    });

    // TPA Settings Subsystem
    if (!SettingsStore || SettingsStore.get("tpaSystem")) {
        menuVector.push({
            text: "\u00A7e\u00A7lTPA SETTINGS\n\u00A78Toggles and blocked players",
            icon: "textures/ui/world_glyph",
            action: async () => {
                const { showTpaSettingsUI } = await import("./tpa/TpaSettingsUI.js");
                Kernel.system.run(() => showTpaSettingsUI(player));
            }
        });
    }

    // Admin Section (conditional on clearance level)
    const PermissionManager = Kernel.get("permissions");
    const isAdmin = PermissionManager ? PermissionManager.hasPermission(player, "essentials.admin") : false;

    if (isAdmin) {
        menuVector.push({
            text: "\u00A7c\u00A7lADMIN PANEL\n\u00A78Server management and settings",
            icon: "textures/ui/op",
            action: async () => {
                const { showAdminPanel } = await import("../commands/admin/AdminPanelMain.js");
                Kernel.system.run(() => showAdminPanel(player));
            }
        });
    }

    // Exit Button
    menuVector.push({
        text: "\u00A7c\u00A7l[EXIT]",
        icon: "textures/ui/cancel",
        action: () => {} // NO-OP
    });

    const form = new Kernel.ActionFormData()
        .title(Lang.UI.MENU_TITLE)
        .body(Lang.UI.MENU_BODY);

    for (const item of menuVector) {
        form.button(item.text, item.icon);
    }

    const res = await UIUtils.showForm(player, form);
    if (res.canceled || !menuVector[res.selection]) return;

    menuVector[res.selection].action();
}

export async function showMainMenu(player) {
    return showMainGUI(player);
}
