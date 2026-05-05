import { world } from "@minecraft/server"
import { ActionFormData, MessageFormData } from "@minecraft/server-ui"

/*
 * GLOBAL_DATA_PURGE_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-clearance administrative interface for performing a scorched-earth 
 * reset of the server's persistent data-buffers. Orchestrates the 
 * de-registration of dynamic properties across multiple sub-systems.
 *
 * PHILOSOPHY: If the state is corrupt, purge it. This vector provides 
 * the surgical tools for a total industrial reset.
 */
export const ResetDataCommand = {
    name: "resetdata",
    description: "Orchestrates a total purge of specific industrial data-buffers.",
    usage: "!resetdata",
    permission: "essentials.admin.resetdata",
    category: "Admin",

    /* 
     * UI_ENTRY_PIPELINE
     */
    async execute(player) {
        player.sendMessage("§0§l» §c§lRESET_PROTOCOL_INITIATED §0«")
        await showCategorySelection(player)
    }
}

/* 
 * CATEGORY_SELECTION_ENGINE
 */
async function showCategorySelection(player) {
    const form = new ActionFormData()
        .title("§6§lDATA_PURGE_SELECTION")
        .body("§cWARNING: This action initiates permanent data-buffer termination.\n\nSelect the target manifest for decommissioning:")
        .button("§c[TOTAL_PURGE]")
        .button("§eLIQUIDITY_BUFFER (MONEY)")
        .button("§aSPATIAL_HOMES")
        .button("§bSPATIAL_WARPS")
        .button("§cBLACKLIST_REGISTRY (BANS)")
        .button("§dMARKET_PRICE_MANIFEST")
        .button("§6COMMERCE_NODES (SHOP)")
        .button("§fHIERARCHY_MANIFEST (RANKS)")
        .button("§9FLOATING_TEXT_REGISTRY")
        .button("§7ABORT_SESSION")

    const res = await form.show(player)
    if (res.canceled || res.selection === 9) return

    const categories = [
        "TOTAL_PURGE",
        "MONEY", 
        "HOMES",
        "WARPS",
        "BANS",
        "SELL_PRICES",
        "SHOP",
        "RANKS",
        "FLOATING_TEXT"
    ]

    const category = categories[res.selection]
    await showConfirmation(player, category)
}

/* 
 * TERMINATION_CONFIRMATION_GATE
 */
async function showConfirmation(player, category) {
    const form = new MessageFormData()
        .title("§6§lCONFIRM_TERMINATION")
        .body(`§cTarget manifest: ${category}.\n\n§eThis action triggers permanent reality-state mutation.\n\nAre you absolutely sure?`)
        .button1("§cABORT")
        .button2("§4§lINITIATE_PURGE")

    const res = await form.show(player)
    if (res.canceled || res.selection === 0) return

    await performReset(player, category)
}

/* 
 * RESET_EXECUTION_ENGINE
 */
async function performReset(player, category) {
    try {
        let successCount = 0
        let errorCount = 0

        const runReset = async (fn) => {
            const success = await fn()
            if (success) successCount++
            else errorCount++
        }

        switch (category) {
            case "TOTAL_PURGE":
                await runReset(resetMoney)
                await runReset(resetHomes)
                await runReset(resetWarps)
                await runReset(resetBans)
                await runReset(resetSellPrices)
                await runReset(resetShop)
                await runReset(resetRanks)
                await runReset(resetFloatingText)
                break

            case "MONEY":
                await runReset(resetMoney)
                break

            case "HOMES":
                await runReset(resetHomes)
                break

            case "WARPS":
                await runReset(resetWarps)
                break

            case "BANS":
                await runReset(resetBans)
                break

            case "SELL_PRICES":
                await runReset(resetSellPrices)
                break

            case "SHOP":
                await runReset(resetShop)
                break

            case "RANKS":
                await runReset(resetRanks)
                break

            case "FLOATING_TEXT":
                await runReset(resetFloatingText)
                break
        }

        if (errorCount === 0) {
            player.sendMessage(`[Success] ${category} manifest terminated. (${successCount} sub-vectors purged).`);
        } else {
            player.sendMessage(`[Warning] Reset complete with partial failures.`);
        }

    } catch (error) {
        player.sendMessage(`[Fatal] Reset pipeline collapse: ${error.message}`);
        console.error(`[ResetDataCommand] CRASH for ${category}:`, error)
    }
}

/* 
 * SUB-SYSTEM_PURGE_VECTORS
 */
async function resetMoney() {
    try {
        world.setDynamicProperty("ae:economy_data", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetHomes() {
    try {
        world.setDynamicProperty("ae:homes_data", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetWarps() {
    try {
        world.setDynamicProperty("ae:warps", undefined)
        world.setDynamicProperty("ae:warp:list", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetBans() {
    try {
        world.setDynamicProperty("ae:bans", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetSellPrices() {
    try {
        world.setDynamicProperty("ae:sell_prices", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetShop() {
    try {
        world.setDynamicProperty("ae:shop_data", undefined)
        world.setDynamicProperty("ae:shop_items", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetRanks() {
    try {
        world.setDynamicProperty("ae:rank:list", undefined)
        return true
    } catch (error) {
        return false
    }
}

async function resetFloatingText() {
    try {
        world.setDynamicProperty("ae:floatingtexts", undefined)
        return true
    } catch (error) {
        return false
    }
}
