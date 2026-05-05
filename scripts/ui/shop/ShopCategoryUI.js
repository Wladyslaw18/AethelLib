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
        .title("§0§l» §6§lCOMMERCE_ENGINE§0 «")
        .body(`§7Interface: §eSTABLE§7\n§7Liquidity_Buffer: §6$${balance}§7\n\n§7Select industrial trade-module:`)
        .button("§c[TERMINATE_SESSION]")
        .button("§lCOMBAT_ORDINANCE\n§8(WEAPONS)", "textures/items/diamond_sword")
        .button("§lPROTECTION_SUITES\n§8(ARMOR)", "textures/items/diamond_chestplate")
        .button("§lMINING_EQUIPMENT\n§8(TOOLS)", "textures/items/diamond_pickaxe")
        .button("§lBIOMASS_SUPPLY\n§8(FOOD)", "textures/items/apple")
        .button("§lCONSTRUCTION_MATERIALS\n§8(BLOCKS)", "textures/items/stone_bricks")
        .button("§lARCANE_AUGMENTATIONS\n§8(ENCHANTS)", "textures/items/book_enchanted")
        .button("§lGLOBAL_QUERY\n§8(SEARCH)", "textures/ui/magnifying_glass")

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
        .title("§6INDUSTRIAL_QUERY")
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
