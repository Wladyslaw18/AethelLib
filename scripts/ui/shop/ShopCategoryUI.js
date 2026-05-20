import { Kernel } from "../../core/Kernel.js"
import { UIUtils } from "../UIUtils.js"

/*
 * COMMERCE_CATEGORY_MANIFEST_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * Orchestrates the visual manifestation of trade categories within the 
 * industrial commerce engine. Performs a real-time query of the entity's 
 * liquidity-buffer for display.
 *
 * PHILOSOPHY: Organization is the key to efficient commerce. Use this 
 * vector to route the entity to specific trade-modules.
 */
export async function showCategoryUI(player) {
    const balance = Kernel.get("economy").getBalance(player)
    
    const form = new Kernel.ActionFormData()
        .title("\u00A70\u00A7l» \u00A76\u00A7lCOMMERCE_ENGINE\u00A70 «")
        .body(`\u00A77Interface: \u00A7eSTABLE\u00A77\n\u00A77Liquidity_Buffer: \u00A76$${balance}\u00A77\n\n\u00A77Select industrial trade-module:`)
        .button("\u00A7c[TERMINATE_SESSION]")
        .button("\u00A7lCOMBAT_ORDINANCE\n\u00A78(WEAPONS)", "textures/items/diamond_sword")
        .button("\u00A7lPROTECTION_SUITES\n\u00A78(ARMOR)", "textures/items/diamond_chestplate")
        .button("\u00A7lMINING_EQUIPMENT\n\u00A78(TOOLS)", "textures/items/diamond_pickaxe")
        .button("\u00A7lBIOMASS_SUPPLY\n\u00A78(FOOD)", "textures/items/apple")
        .button("\u00A7lCONSTRUCTION_MATERIALS\n\u00A78(BLOCKS)", "textures/items/stone_bricks")
        .button("\u00A7lARCANE_AUGMENTATIONS\n\u00A78(ENCHANTS)", "textures/items/book_enchanted")
        .button("\u00A7lGLOBAL_QUERY\n\u00A78(SEARCH)", "textures/ui/magnifying_glass")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    if (res.selection === 0) {
        const { showMainGUI } = await import("../MainGUI.js")
        return showMainGUI(player)
    }

    const categories = [null, "weapons", "armor", "tools", "food", "blocks", "enchants"]
    
    if (res.selection === 7) {
        await showSearchUI(player)
    } else if (res.selection > 0 && res.selection < categories.length) {
        await showItemList(player, categories[res.selection])
    }
}

/* 
 * ASSET_QUERY_INTERFACE
 */
export async function showSearchUI(player) {
    const { ModalFormData } = Kernel
    const { showSearchResults } = await import("./ShopSearchUI.js")
    
    const modal = new ModalFormData()
        .title("\u00A76INDUSTRIAL_QUERY")
        .textField("Input entity identifier or asset name:", "e.g. diamond...")

    const res = await UIUtils.showForm(player, modal)
    if (res.canceled) return

    const query = String(res.formValues[0] ?? '').toLowerCase()
    await showSearchResults(player, query)
}

/* 
 * ITEM_MANIFEST_REDIRECTION
 */
export async function showItemList(player, category) {
    const { showItemList } = await import("./ShopItemListUI.js")
    await showItemList(player, category)
}
