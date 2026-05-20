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
        .body(auctions.length === 0 ? "\u00A7cNO ACTIVE LISTINGS." : "\u00A77Select item to view details.")

    auctions.forEach(a => {
        const time = AuctionStore.getTimeRemaining(a.endTime)
        const price = a.buyNowPrice > 0 ? `\u00A7a$${a.buyNowPrice.toLocaleString()}` : `\u00A7eBid: $${a.currentBid.toLocaleString()}`
        form.button(`\u00A7f\u00A7l${a.itemName.toUpperCase()} \u00A77x${a.quantity}\n\u00A77Seller: \u00A78${a.sellerName} \u00A77| ${price} \u00A77| \u00A76${time}`, Lang.getTexture(a.itemId))
    })
    form.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

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
        .body(auctions.length === 0 ? "\u00A7cNO LISTINGS." : "\u00A77Select to manage.")

    auctions.forEach(a => {
        const status = a.status.toUpperCase()
        form.button(`\u00A7f\u00A7l${a.itemName} \u00A77x${a.quantity}\n\u00A77Status: \u00A7e${status} \u00A77| \u00A76${AuctionStore.getTimeRemaining(a.endTime)}`, Lang.getTexture(a.itemId))
    })
    form.button("\u00A7c\u00A7l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === auctions.length) {
        const { showAuctionUI } = await import("./AuctionUI.js")
        Kernel.system.run(() => showAuctionUI(player))
        return
    }

    const { showAuctionDetailUI } = await import("./AuctionActionUI.js")
    Kernel.system.run(() => showAuctionDetailUI(player, auctions[res.selection]))
}
