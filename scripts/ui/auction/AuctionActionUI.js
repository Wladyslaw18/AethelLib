import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui"
import { system } from "@minecraft/server"
import { EntityComponentTypes } from "@minecraft/server"
import { AuctionStore } from "../../systems/auction/AuctionStore.js"
import { AuctionService } from "../../systems/auction/AuctionService.js"

import { UIUtils } from "../UIUtils.js"

/*
 * AUCTION_ACTION_INTERFACE
 */

export async function showAuctionDetailUI(player, auction) {
    const time = AuctionStore.getTimeRemaining(auction.endTime)
    const form = new ActionFormData()
        .title("§6Auction Details")

        .body(`§7Item: §f${auction.itemName}\n§7Qty: §e${auction.quantity}\n§7Seller: §e${auction.sellerName}\n§7Time: §6${time}\n\n§7Bid: §e$${auction.currentBid.toLocaleString()}\n§7Bidder: §b${auction.currentBidderName || "NONE"}\n§7Buy Now: §a$${auction.buyNowPrice ? auction.buyNowPrice.toLocaleString() : "DISABLED"}`)

    if (auction.status === "active") {
        if (auction.sellerId !== player.id) {
            form.button("§e§lPLACE BID\n§8Submit a higher bid")
            if (auction.buyNowPrice > 0) form.button("§a§lBUY NOW\n§8Buy this item instantly")
        } else form.button("§c§lCANCEL AUCTION\n§8Remove from the auction house")

    } else form.button("§6§lCLAIM ITEMS\n§8Get your items or credits back")


    form.button("§cBack", "textures/ui/refresh")


    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return
    
    const backIndex = (auction.status === "active" ? (auction.sellerId !== player.id ? (auction.buyNowPrice > 0 ? 3 : 2) : 2) : 2)
    if (res.selection === backIndex) {
        const { showBrowseUI } = await import("./AuctionBrowseUI.js")
        system.run(() => showBrowseUI(player))
        return
    }

    // Logic for selection handled here... (omitted for brevity, assume split if needed)
    handleActionSelection(player, auction, res.selection)
}

async function handleActionSelection(player, auction, selection) {
    if (auction.status === "active") {
        if (auction.sellerId !== player.id) {
            if (selection === 0) system.run(() => showBidUI(player, auction))
            if (selection === 1 && auction.buyNowPrice > 0) system.run(() => handleBuyNow(player, auction))
        } else if (selection === 0) {
            AuctionStore.deleteAuction(auction.id)
            player.sendMessage("§a§l» §fAuction cancelled. Your item has been returned.")
        }

    } else if (selection === 0) {
        const result = AuctionStore.claimAsset(auction.id, player.id)
        player.sendMessage(`§a§l» §fSuccess: ${result.message}`)
    }

}

async function showBidUI(player, auction) {
    const minBid = auction.currentBid + Math.ceil(auction.currentBid * 0.05)
    const form = new ModalFormData()
        .title("§6Place Bid")

        .textField(`Amount (Min: \u00A7e$${minBid.toLocaleString()}\u00A77):`, "0", { defaultValue: String(minBid) })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled) return

    await AuctionService.placeBid(player, auction, Number(res.formValues[0]))
}

async function handleBuyNow(player, auction) {
    const confirm = new MessageFormData()
        .title("§6Buy Now")

        .body(`Confirm purchase for §a$${auction.buyNowPrice.toLocaleString()}?`)
        .button1("§cCancel")
        .button2("§aBuy Now")


    const res = await UIUtils.showForm(player, confirm)
    if (res.canceled || res.selection === 0) return

    await AuctionService.buyNow(player, auction)
}

export async function showCreateUI(player) {
    const equippable = player.getComponent(EntityComponentTypes.Equippable)
    const item = equippable.getEquipment("Mainhand")

    if (!item) {
        player.sendMessage("§c§l» §7You must be holding an item to list it.")
        return
    }


    const form = new ModalFormData()
        .title("§6Create Auction")

        .toggle(`List ${item.typeId.replace("minecraft:", "").toUpperCase()} x${item.amount}?`, { defaultValue: true })
        .textField("Start Bid ($):", "100", { defaultValue: "100" })
        .textField("Buy Now ($) [0 to disable]:", "1000", { defaultValue: "1000" })
        .slider("Duration (Hours):", 1, 48, { valueStep: 1, defaultValue: 24 })

    const res = await UIUtils.showForm(player, form)
    if (res.canceled || !res.formValues[0]) return

    // 🔥 RE-VERIFY AFTER AWAIT!
    const currentItem = equippable.getEquipment("Mainhand");
    if (!currentItem || currentItem.typeId !== item.typeId || currentItem.amount !== item.amount) {
        player.sendMessage("§c§l» §7Transaction aborted: Asset state changed during UI operation.");
        return;
    }

    const [_, start, buy, dur] = res.formValues
    AuctionStore.createAuction(player.id, player.name, item.typeId, item.typeId.replace("minecraft:", "").toUpperCase(), item.amount, Number(start), Number(buy), Number(dur))
    equippable.setEquipment("Mainhand", undefined)
    player.sendMessage("§a§l» §fItem listed successfully on the Auction House!")
}


