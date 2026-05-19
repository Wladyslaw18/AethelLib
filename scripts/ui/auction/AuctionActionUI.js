import { Kernel } from "../../core/Kernel.js";
import { AuctionStore } from "../../systems/auction/AuctionStore.js"
import { AuctionService } from "../../systems/auction/AuctionService.js"

import { UIUtils } from "../UIUtils.js"

/*
 * AUCTION_ACTION_INTERFACE
 */

export async function showAuctionDetailUI(player, auction) {
    const time = AuctionStore.getTimeRemaining(auction.endTime)
    const form = new Kernel.ActionFormData()
        .title("\xA76Auction Details")

        .body(`\xA77Item: \xA7f${auction.itemName}\n\xA77Qty: \xA7e${auction.quantity}\n\xA77Seller: \xA7e${auction.sellerName}\n\xA77Time: \xA76${time}\n\n\xA77Bid: \xA7e$${auction.currentBid.toLocaleString()}\n\xA77Bidder: \xA7b${auction.currentBidderName || "NONE"}\n\xA77Buy Now: \xA7a$${auction.buyNowPrice ? auction.buyNowPrice.toLocaleString() : "DISABLED"}`)

    if (auction.status === "active") {
        if (auction.sellerId !== player.id) {
            form.button("\xA7e\xA7lPLACE BID\n\xA78Submit a higher bid")
            if (auction.buyNowPrice > 0) form.button("\xA7a\xA7lBUY NOW\n\xA78Buy this item instantly")
        } else form.button("\xA7c\xA7lCANCEL AUCTION\n\xA78Remove from the auction house")

    } else form.button("\xA76\xA7lCLAIM ITEMS\n\xA78Get your items or credits back")


    form.button("\xA7cBack", "textures/ui/refresh")


    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    
    const backIndex = (auction.status === "active" ? (auction.sellerId !== player.id ? (auction.buyNowPrice > 0 ? 3 : 2) : 2) : 2)
    if (res.selection === backIndex) {
        const { showBrowseUI } = await import("./AuctionBrowseUI.js")
        Kernel.system.run(() => showBrowseUI(player))
        return
    }

    // Logic for selection handled here... (omitted for brevity, assume split if needed)
    handleActionSelection(player, auction, res.selection)
}

async function handleActionSelection(player, auction, selection) {
    if (auction.status === "active") {
        if (auction.sellerId !== player.id) {
            if (selection === 0) Kernel.system.run(() => showBidUI(player, auction))
            if (selection === 1 && auction.buyNowPrice > 0) Kernel.system.run(() => handleBuyNow(player, auction))
        } else if (selection === 0) {
            AuctionStore.deleteAuction(auction.id)
            player.sendMessage("\xA7a\xA7l» \xA7fAuction cancelled. Your item has been returned.")
        }

    } else if (selection === 0) {
        const result = AuctionStore.claimAsset(auction.id, player.id)
        player.sendMessage(`\xA7a\xA7l» \xA7fSuccess: ${result.message}`)
    }

}

async function showBidUI(player, auction) {
    const minBid = auction.currentBid + Math.ceil(auction.currentBid * 0.05)
    const form = new Kernel.ModalFormData()
        .title("\xA76Place Bid")

        .textField(`Amount (Min: \u00A7e$${minBid.toLocaleString()}\u00A77):`, "0", { defaultValue: String(minBid) })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    await AuctionService.placeBid(player, auction, Number(res.formValues[0]))
}

async function handleBuyNow(player, auction) {
    const confirm = new Kernel.MessageFormData()
        .title("\xA76Buy Now")

        .body(`Confirm purchase for \xA7a$${auction.buyNowPrice.toLocaleString()}?`)
        .button1("\xA7cCancel")
        .button2("\xA7aBuy Now")


    const res = await UIUtils.showForm(player, confirm)
    if (res.canceled || res.selection === 0) return

    await AuctionService.buyNow(player, auction)
}

export async function showCreateUI(player) {
    const equippable = player.getComponent(Kernel.EntityComponentTypes.Equippable)
    const item = equippable.getEquipment("Mainhand")

    if (!item) {
        player.sendMessage("\xA7c\xA7l» \xA77You must be holding an item to list it.")
        return
    }


    const form = new Kernel.ModalFormData()
        .title("\xA76Create Auction")

        .toggle(`List ${item.typeId.replace("minecraft:", "").toUpperCase()} x${item.amount}?`, { defaultValue: true })
        .textField("Start Bid ($):", "100", { defaultValue: "100" })
        .textField("Buy Now ($) [0 to disable]:", "1000", { defaultValue: "1000" })
        .slider("Duration (Hours):", 1, 48, { valueStep: 1, defaultValue: 24 })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || !res.formValues[0]) return

    // 🔥 RE-VERIFY AFTER AWAIT!
    const currentItem = equippable.getEquipment("Mainhand");
    if (!currentItem || currentItem.typeId !== item.typeId || currentItem.amount !== item.amount) {
        player.sendMessage("\xA7c\xA7l» \xA77Transaction aborted: Asset state changed during UI operation.");
        return;
    }

    const [_, start, buy, dur] = res.formValues
    AuctionStore.createAuction(player.id, player.name, item.typeId, item.typeId.replace("minecraft:", "").toUpperCase(), item.amount, Number(start), Number(buy), Number(dur))
    equippable.setEquipment("Mainhand", undefined)
    player.sendMessage("\xA7a\xA7l» \xA7fItem listed successfully on the Auction House!")
}


