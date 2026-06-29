import { ActionFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
import { AuctionStore } from "../../systems/auction/AuctionStore.js"
import { Lang } from "../Lang.js"
import { UIUtils } from "../UIUtils.js"

/*
 * AUCTION_BROWSER_INTERFACE
 */

export async function showBrowseUI(player) {
    const auctions = AuctionStore.getActiveAuctions()
    const form = new ActionFormData()
        .title(Lang.GOLD + "BROWSE")
        .body(auctions.length === 0 ? "§cNO ACTIVE LISTINGS." : "§7Select item to view details.")

    auctions.forEach(a => {
        const time = AuctionStore.getTimeRemaining(a.endTime)
        const price = a.buyNowPrice > 0 ? `§a$${a.buyNowPrice.toLocaleString()}` : `§eBid: $${a.currentBid.toLocaleString()}`
        form.button(`§f§l${a.itemName.toUpperCase()} §7x${a.quantity}\n§7Seller: §8${a.sellerName} §7| ${price} §7| §6${time}`, Lang.getTexture(a.itemId))
    })
    form.button("§c§l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === auctions.length) {
        const { showAuctionUI } = await import("./AuctionUI.js")
        system.run(() => showAuctionUI(player))
        return
    }

    const { showAuctionDetailUI } = await import("./AuctionActionUI.js")
    system.run(() => showAuctionDetailUI(player, auctions[res.selection]))
}

export async function showMyAuctionsUI(player) {
    const auctions = AuctionStore.getPlayerAuctions(player.id)
    const form = new ActionFormData()
        .title(Lang.GOLD + "MY LISTINGS")
        .body(auctions.length === 0 ? "§cNO LISTINGS." : "§7Select to manage.")

    auctions.forEach(a => {
        const status = a.status.toUpperCase()
        form.button(`§f§l${a.itemName} §7x${a.quantity}\n§7Status: §e${status} §7| §6${AuctionStore.getTimeRemaining(a.endTime)}`, Lang.getTexture(a.itemId))
    })
    form.button("§c§l[BACK]", "textures/ui/refresh")

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || res.selection === auctions.length) {
        const { showAuctionUI } = await import("./AuctionUI.js")
        system.run(() => showAuctionUI(player))
        return
    }

    const { showAuctionDetailUI } = await import("./AuctionActionUI.js")
    system.run(() => showAuctionDetailUI(player, auctions[res.selection]))
}
