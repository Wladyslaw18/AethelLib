import { Kernel } from "../../core/Kernel.js";
import { AuctionStore } from "../../systems/auction/AuctionStore.js"
import { EconomyStore } from "../../systems/economy/EconomyStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * AUCTION_MAIN_HUB
 */

export async function showAuctionUI(player) {
    const auctions = AuctionStore.getActiveAuctions()
    const balance = await EconomyStore.getBalance(player)
    
    const form = new Kernel.ActionFormData()
        .title(Lang.UI.AUCTION_TITLE)
        .body(`\u00A77Active Listings: \u00A7e${auctions.length}\n\u00A77Balance: \u00A7a$${balance.toLocaleString()}`)
        .button("\u00A76\u00A7lBROWSE\n\u00A78Explore active listings", "textures/items/golden_carrot")
        .button("\u00A7e\u00A7lLIST ITEM\n\u00A78Create new auction", "textures/blocks/gold_block")
        .button("\u00A7b\u00A7lMY LISTINGS\n\u00A78Manage active auctions", "textures/blocks/chest_front")
        .button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    
    if (res.selection === 3) {
        const { showMainGUI } = await import("../MainGUI.js")
        Kernel.system.run(() => showMainGUI(player))
        return
    }

    switch (res.selection) {
        case 0: {
            const { showBrowseUI } = await import("./AuctionBrowseUI.js")
            Kernel.system.run(() => showBrowseUI(player)); 
            break
        }
        case 1: {
            const { showCreateUI } = await import("./AuctionActionUI.js")
            Kernel.system.run(() => showCreateUI(player)); 
            break
        }
        case 2: {
            const { showMyAuctionsUI } = await import("./AuctionBrowseUI.js")
            Kernel.system.run(() => showMyAuctionsUI(player)); 
            break
        }
    }
}
