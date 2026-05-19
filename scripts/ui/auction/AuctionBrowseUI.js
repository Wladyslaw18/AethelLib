import { Kernel } from "../../core/Kernel.js";
import { AuctionStore } from "../../systems/auction/AuctionStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * AUCTION_BROWSER_INTERFACE
 */

export async function showBrowseUI(player) {
    const auctions = AuctionStore.getActiveAuctions()
    const form = new Kernel.ActionFormData()
        .title(Lang.GOLD + "BROWSE")
        .body(auctions.length === 0 ? "\xA7cNO ACTIVE LISTINGS." : "\xA77Select item to view details.")

    auctions.forEach(a => {
        const time = AuctionStore.getTimeRemaining(a.endTime)
        const price = a.buyNowPrice > 0 ? `\xA7a$${a.buyNowPrice.toLocaleString()}` : `\xA7eBid: $${a.currentBid.toLocaleString()}`
        form.button(`\xA7f\xA7l${a.itemName.toUpperCase()} \xA77x${a.quantity}\n\xA77Seller: \xA78${a.sellerName} \xA77| ${price} \xA77| \xA76${time}`, Lang.getTexture(a.itemId))
    })
    form.button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === auctions.length) {
        const { showAuctionUI } = await import("./AuctionUI.js")
        Kernel.system.run(() => showAuctionUI(player))
        return
    }

    const { showAuctionDetailUI } = await import("./AuctionActionUI.js")
    Kernel.system.run(() => showAuctionDetailUI(player, auctions[res.selection]))
}

export async function showMyAuctionsUI(player) {
    const auctions = AuctionStore.getPlayerAuctions(player.id)
    const form = new Kernel.ActionFormData()
        .title(Lang.GOLD + "MY LISTINGS")
        .body(auctions.length === 0 ? "\xA7cNO LISTINGS." : "\xA77Select to manage.")

    auctions.forEach(a => {
        const status = a.status.toUpperCase()
        form.button(`\xA7f\xA7l${a.itemName} \xA77x${a.quantity}\n\xA77Status: \xA7e${status} \xA77| \xA76${AuctionStore.getTimeRemaining(a.endTime)}`, Lang.getTexture(a.itemId))
    })
    form.button("\xA7c\xA7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === auctions.length) {
        const { showAuctionUI } = await import("./AuctionUI.js")
        Kernel.system.run(() => showAuctionUI(player))
        return
    }

    const { showAuctionDetailUI } = await import("./AuctionActionUI.js")
    Kernel.system.run(() => showAuctionDetailUI(player, auctions[res.selection]))
}
