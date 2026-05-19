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
        .body(`\xA77Active Listings: \xA7e${auctions.length}\n\xA77Balance: \xA7a$${balance.toLocaleString()}`)
        .button("\xA76\xA7lBROWSE\n\xA78Explore active listings", "textures/items/golden_carrot")
        .button("\xA7e\xA7lLIST ITEM\n\xA78Create new auction", "textures/blocks/gold_block")
        .button("\xA7b\xA7lMY LISTINGS\n\xA78Manage active auctions", "textures/blocks/chest_front")
        .button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

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
