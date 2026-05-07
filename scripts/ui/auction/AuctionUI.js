import { ActionFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
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
    
    const form = new ActionFormData()
        .title(Lang.UI.AUCTION_TITLE)
        .body(`§7Active Listings: §e${auctions.length}\n§7Balance: §a$${balance.toLocaleString()}`)
        .button("§6§lBROWSE\n§8Explore active listings", "textures/items/golden_carrot")
        .button("§e§lLIST ITEM\n§8Create new auction", "textures/blocks/gold_block")
        .button("§b§lMY LISTINGS\n§8Manage active auctions", "textures/blocks/chest_front")
        .button("§c§l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    
    if (res.selection === 3) {
        const { showMainGUI } = await import("../MainGUI.js")
        system.run(() => showMainGUI(player))
        return
    }

    switch (res.selection) {
        case 0: {
            const { showBrowseUI } = await import("./AuctionBrowseUI.js")
            system.run(() => showBrowseUI(player)); 
            break
        }
        case 1: {
            const { showCreateUI } = await import("./AuctionActionUI.js")
            system.run(() => showCreateUI(player)); 
            break
        }
        case 2: {
            const { showMyAuctionsUI } = await import("./AuctionBrowseUI.js")
            system.run(() => showMyAuctionsUI(player)); 
            break
        }
    }
}
