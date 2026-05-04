/**
 * Auction Command - Manage auction house
 */

import { system } from "@minecraft/server"
import { AuctionStore } from "../../systems/auction/AuctionStore.js"

import { MessageFormData, ActionFormData, ModalFormData } from "@minecraft/server-ui"

export const AuctionCommand = {
    name: "auction",
    description: "Auction house management",
    usage: "!auction [browse|create|my|bid]",
    permission: "essentials.auction",
    category: "economy",

    execute(data, player, args) {
        const action = args[0]?.toLowerCase()
        
        if (!action) {
            showAuctionMenu(player)
            return
        }

        switch (action) {
            case "browse":
                handleBrowse(player, args.slice(1))
                break
            case "create":
                handleCreate(player, args.slice(1))
                break
            case "my":
                handleMyAuctions(player)
                break
            case "bid":
                handleBid(player, args.slice(1))
                break
            default:
                showAuctionMenu(player)
        }
    }
}

function showAuctionMenu(player) {
    // MessageFormData is already imported
    const form = new MessageFormData()
        .title("§6§lAuction House")
        .body("§7Welcome to the Auction House!\n\n§a• Browse - View active auctions\n§a• Create - List new auction\n§a• My Auctions - View your listings\n§a• Bid - Place bid on auction")
        .button1("§aBrowse Auctions")
        .button2("§bCreate Auction")

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        if (res.selection === 0) handleBrowse(player, [])
        else handleCreate(player, [])
    })
}

function handleBrowse(player, args) {
    const page = parseInt(args[0]) || 1
    const auctions = AuctionStore.getActiveAuctions(45)
    
    if (auctions.length === 0) {
        player.sendMessage("§cNo active auctions")
        return
    }

    const form = new ActionFormData()
        .title("§6§lBrowse Auctions")
        .body(`Page ${page} • ${auctions.length} auctions`)

    // Add auction buttons
    auctions.forEach(auction => {
        const timeRemaining = AuctionStore.getTimeRemaining(auction.endTime)
        const currentBid = auction.currentBid > auction.startingBid ? 
            `§6$§e${auction.currentBid.toLocaleString()}` : 
            `§7Starting: §6$§e${auction.startingBid.toLocaleString()}`
        
        const buttonText = `§e${auction.itemName} §7x${auction.quantity}\n§a${currentBid}\n§8${timeRemaining}`
        
        form.button(buttonText)
    })

    // Add navigation
    if (auctions.length === 45) {
        form.button(`§eNext Page ►`)
    } else {
        form.button(`§cBack`)
    }

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        
        if (res.selection === auctions.length) {
            // Next page
            handleBrowse(player, [page + 1])
        } else if (res.selection === auctions.length + 1) {
            // Back
            showAuctionMenu(player)
        } else if (res.selection >= 0 && res.selection < auctions.length) {
            showAuctionDetails(player, auctions[res.selection])
        }
    })
}

function handleCreate(player, args) {
    if (args.length < 4) {
        showCreateDialog(player)
        return
    }

    const itemName = args[0]
    const quantity = parseInt(args[1]) || 1
    const startingBid = parseInt(args[2]) || 0
    const buyNowPrice = parseInt(args[3]) || 0

    if (quantity <= 0 || startingBid < 0 || buyNowPrice < 0) {
        player.sendMessage("§cInvalid values")
        return
    }

    // Check if player has the item
    const hasItem = checkPlayerHasItem(player, itemName, quantity)
    if (!hasItem) {
        player.sendMessage(`§cYou don't have ${quantity}x ${itemName}`)
        return
    }

    const auction = AuctionStore.createAuction(
        player.id, 
        player.name, 
        itemName, 
        itemName, 
        quantity, 
        startingBid, 
        buyNowPrice
    )

    player.sendMessage(`§aAuction created! ID: ${auction.id}`)
}

function showCreateDialog(player) {
    const form = new ModalFormData()
        .title("§6§lCreate Auction")
        .textField("Item Name:", "Diamond Sword")
        .textField("Quantity:", "1")
        .textField("Starting Bid:", "100")
        .textField("Buy Now Price (0 for none):", "500")

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        const [itemName, quantity, startingBid, buyNowPrice] = res.formValues
        if (itemName && quantity && startingBid && buyNowPrice) {
            handleCreate(player, [itemName.trim(), quantity, startingBid, buyNowPrice])
        } else {
            player.sendMessage("§cInvalid auction details")
        }
    })
}

function handleMyAuctions(player) {
    const auctions = AuctionStore.getPlayerAuctions(player.id)
    
    if (auctions.length === 0) {
        player.sendMessage("§cYou have no active auctions")
        return
    }

    const form = {
        type: "form",
        title: "§6§lMy Auctions",
        buttons: auctions.map(auction => ({
            text: `§e${auction.itemName} §7x${auction.quantity}\n§a${AuctionStore.formatMoney(auction.currentBid)}\n§8${auction.status}`,
            value: auction
        }))
    }

    system.run(() => {
        player.onFormResponse(form, (response) => {
            if (response) {
                showAuctionDetails(player, response)
            }
        })
    })
}

function handleBid(player, args) {
    if (args.length === 0) {
        player.sendMessage("§cUsage: !auction bid <auction_id> <amount>")
        return
    }

    const auctionId = args[0]
    const bidAmount = parseInt(args[1])

    if (!bidAmount || bidAmount <= 0) {
        player.sendMessage("§cInvalid bid amount")
        return
    }

    const result = AuctionStore.placeBid(auctionId, player.id, player.name, bidAmount)
    
    if (result.success) {
        player.sendMessage(`§a${result.message}`)
    } else {
        player.sendMessage(`§c${result.message}`)
    }
}

function showAuctionDetails(player, auction) {
    const timeRemaining = AuctionStore.getTimeRemaining(auction.endTime)
    const buyNowText = auction.buyNowPrice > 0 ? 
        `§7Buy Now: §a${AuctionStore.formatMoney(auction.buyNowPrice)}` : 
        "§7Buy Now: §cNot available"
    
    const form = new MessageFormData()
        .title(`§6§l${auction.itemName}`)
        .body(`§7Seller: §e${auction.sellerName}\n§7Quantity: §e${auction.quantity}\n§7Current Bid: §a${AuctionStore.formatMoney(auction.currentBid)}\n§7${buyNowText}\n§7Time Remaining: §e${timeRemaining}\n§7Status: §e${auction.status}\n\n§eChoose an action:`)
        .button1(auction.status === "active" ? "§aPlace Bid" : "§cAuction Ended")
        .button2(auction.status === "active" && auction.buyNowPrice > 0 ? "§6Buy Now" : "§cClose")

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        
        if (res.selection === 0 && auction.status === "active") {
            showBidDialog(player, auction)
        } else if (res.selection === 1 && auction.status === "active" && auction.buyNowPrice > 0) {
            const result = AuctionStore.buyNow(auction.id, player.id, player.name)
            if (result.success) {
                player.sendMessage(`§a${result.message}`)
            } else {
                player.sendMessage(`§c${result.message}`)
            }
        }
    })
}

function showBidDialog(player, auction) {
    const form = new ModalFormData()
        .title(`§6§lBid on ${auction.itemName}`)
        .textField("Your Bid:", `Enter amount > ${auction.currentBid}...`)

    system.run(async () => {
        const res = await form.show(player)
        if (res.canceled) return
        const bidAmount = parseInt(res.formValues[0])
        if (bidAmount && bidAmount > auction.currentBid) {
            const result = AuctionStore.placeBid(auction.id, player.id, player.name, bidAmount)
            if (result.success) {
                player.sendMessage(`§a${result.message}`)
            } else {
                player.sendMessage(`§c${result.message}`)
            }
        } else {
            player.sendMessage("§cInvalid bid amount")
        }
    })
}

function checkPlayerHasItem(player, itemName, quantity) {
    try {
        const container = player.getComponent("minecraft:inventory")?.container
        if (!container) return false
        let found = 0
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i)
            if (item && item.typeId === itemName) {
                found += item.amount
            }
        }
        return found >= quantity
    } catch (e) {
        return false
    }
}

