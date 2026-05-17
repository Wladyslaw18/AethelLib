import { ActionFormData } from "@minecraft/server-ui"
import { Kernel } from "../../core/Kernel.js"

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
    
    const form = new ActionFormData()
        .title("\xA70\xA7l» \xA76\xA7lCOMMERCE_ENGINE\xA70 «")
        .body(`\xA77Interface: \xA7eSTABLE\xA77\n\xA77Liquidity_Buffer: \xA76$${balance}\xA77\n\n\xA77Select industrial trade-module:`)
        .button("\xA7c[TERMINATE_SESSION]")
        .button("\xA7lCOMBAT_ORDINANCE\n\xA78(WEAPONS)", "textures/items/diamond_sword")
        .button("\xA7lPROTECTION_SUITES\n\xA78(ARMOR)", "textures/items/diamond_chestplate")
        .button("\xA7lMINING_EQUIPMENT\n\xA78(TOOLS)", "textures/items/diamond_pickaxe")
        .button("\xA7lBIOMASS_SUPPLY\n\xA78(FOOD)", "textures/items/apple")
        .button("\xA7lCONSTRUCTION_MATERIALS\n\xA78(BLOCKS)", "textures/items/stone_bricks")
        .button("\xA7lARCANE_AUGMENTATIONS\n\xA78(ENCHANTS)", "textures/items/book_enchanted")
        .button("\xA7lGLOBAL_QUERY\n\xA78(SEARCH)", "textures/ui/magnifying_glass")

    const res = await form.show(player)
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
    const { ModalFormData } = await import("@minecraft/server-ui")
    const { showSearchResults } = await import("./ShopSearchUI.js")
    
    const modal = new ModalFormData()
        .title("\xA76INDUSTRIAL_QUERY")
        .textField("Input entity identifier or asset name:", "e.g. diamond...")

    const res = await modal.show(player)
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
