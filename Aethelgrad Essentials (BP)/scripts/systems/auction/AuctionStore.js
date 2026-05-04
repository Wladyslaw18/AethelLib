/**
 * Auction Store - Manages auction house data
 */

import { world } from "@minecraft/server"

export class AuctionStore {
    static getAuctions() {
        try {
            const stored = world.getDynamicProperty("ae:auctions")
            return stored ? JSON.parse(stored) : []
        } catch (error) {
            console.error(`Failed to load auctions: ${error}`)
            return []
        }
    }

    static saveAuctions(auctions) {
        try {
            world.setDynamicProperty("ae:auctions", JSON.stringify(auctions))
            return true
        } catch (error) {
            console.error(`Failed to save auctions: ${error}`)
            return false
        }
    }

    static createAuction(sellerId, sellerName, itemId, itemName, quantity, startingBid, buyNowPrice, duration = 24) {
        const auctions = this.getAuctions()
        const auction = {
            id: this.generateAuctionId(),
            sellerId: sellerId,
            sellerName: sellerName,
            itemId: itemId,
            itemName: itemName,
            quantity: quantity,
            startingBid: startingBid,
            currentBid: startingBid,
            currentBidder: null,
            currentBidderName: null,
            buyNowPrice: buyNowPrice,
            startTime: Date.now(),
            endTime: Date.now() + (duration * 60 * 60 * 1000),
            status: "active"
        }

        auctions.push(auction)
        this.saveAuctions(auctions)
        return auction
    }

    static placeBid(auctionId, bidderId, bidderName, bidAmount) {
        const auctions = this.getAuctions()
        const auction = auctions.find(a => a.id === auctionId)

        if (!auction) {
            return { success: false, message: "Auction not found" }
        }

        if (auction.status !== "active") {
            return { success: false, message: "Auction is not active" }
        }

        if (Date.now() > auction.endTime) {
            return { success: false, message: "Auction has ended" }
        }

        if (auction.sellerId === bidderId) {
            return { success: false, message: "You cannot bid on your own auction" }
        }

        if (bidAmount <= auction.currentBid) {
            return { success: false, message: `Bid must be higher than current bid: §6$§e${auction.currentBid.toLocaleString()}` }
        }

        // Refund previous bidder
        if (auction.currentBidder && auction.currentBidder !== bidderId) {
            this.refundBid(auction.currentBidder, auction.currentBid)
        }

        // Update auction
        auction.currentBid = bidAmount
        auction.currentBidder = bidderId
        auction.currentBidderName = bidderName

        this.saveAuctions(auctions)

        return {
            success: true,
            message: `Bid placed successfully! Current bid: §6$§e${bidAmount.toLocaleString()}`,
            auction: auction
        }
    }

    static buyNow(auctionId, buyerId, buyerName) {
        const auctions = this.getAuctions()
        const auction = auctions.find(a => a.id === auctionId)

        if (!auction) {
            return { success: false, message: "Auction not found" }
        }

        if (auction.status !== "active") {
            return { success: false, message: "Auction is not active" }
        }

        if (!auction.buyNowPrice || auction.buyNowPrice <= 0) {
            return { success: false, message: "Buy Now not available" }
        }

        if (auction.sellerId === buyerId) {
            return { success: false, message: "You cannot buy your own auction" }
        }

        // Check buyer balance
        const buyerBalance = this.getPlayerBalance(buyerId)
        if (buyerBalance < auction.buyNowPrice) {
            return { success: false, message: "Insufficient funds" }
        }

        // Process purchase
        if (!this.removePlayerMoney(buyerId, auction.buyNowPrice)) {
            return { success: false, message: "Failed to process payment" }
        }

        // Add money to seller
        this.addPlayerMoney(auction.sellerId, auction.buyNowPrice)

        // Mark auction as sold
        auction.status = "sold"
        auction.buyerId = buyerId
        auction.buyerName = buyerName
        auction.finalPrice = auction.buyNowPrice

        this.saveAuctions(auctions)

        return {
            success: true,
            message: `Purchased ${auction.quantity}x ${auction.itemName} for §6$§e${auction.buyNowPrice.toLocaleString()}`,
            auction: auction
        }
    }

    static endExpiredAuctions() {
        const auctions = this.getAuctions()
        const now = Date.now()
        let endedAuctions = []

        auctions.forEach(auction => {
            if (auction.status === "active" && now > auction.endTime) {
                if (auction.currentBidder) {
                    // Award to highest bidder
                    this.addPlayerMoney(auction.currentBidder, auction.currentBid)
                    auction.status = "sold"
                    auction.buyerId = auction.currentBidder
                    auction.buyerName = auction.currentBidderName
                    auction.finalPrice = auction.currentBid
                } else {
                    // No bids, return to seller
                    auction.status = "expired"
                }
                endedAuctions.push(auction)
            }
        })

        if (endedAuctions.length > 0) {
            this.saveAuctions(auctions)
        }

        return endedAuctions
    }

    static getPlayerAuctions(playerId) {
        const auctions = this.getAuctions()
        return auctions.filter(a => a.sellerId === playerId)
    }

    static getActiveAuctions(limit = 45) {
        const auctions = this.getAuctions()
        return auctions
            .filter(a => a.status === "active")
            .sort((a, b) => b.endTime - a.endTime)
            .slice(0, limit)
    }

    static refundBid(playerId, amount) {
        this.addPlayerMoney(playerId, amount)
    }

    static getPlayerBalance(playerId) {
        try {
            const balance = world.getDynamicProperty(`ae:balance:${playerId}`)
            return balance || 0
        } catch (error) {
            console.error(`Failed to get player balance: ${error}`)
            return 0
        }
    }

    static addPlayerMoney(playerId, amount) {
        try {
            const currentBalance = this.getPlayerBalance(playerId)
            world.setDynamicProperty(`ae:balance:${playerId}`, currentBalance + amount)
            return true
        } catch (error) {
            console.error(`Failed to add player money: ${error}`)
            return false
        }
    }

    static removePlayerMoney(playerId, amount) {
        try {
            const currentBalance = this.getPlayerBalance(playerId)
            if (currentBalance < amount) return false
            
            world.setDynamicProperty(`ae:balance:${playerId}`, currentBalance - amount)
            return true
        } catch (error) {
            console.error(`Failed to remove player money: ${error}`)
            return false
        }
    }

    static generateAuctionId() {
        return `auction_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }

    static formatMoney(amount) {
        return `§6$§e${amount.toLocaleString()}`
    }

    static getTimeRemaining(endTime) {
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        
        if (remaining === 0) return "Ended"
        
        const hours = Math.floor(remaining / (1000 * 60 * 60))
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`
        } else {
            return `${seconds}s`
        }
    }

    static cleanupOldAuctions() {
        const auctions = this.getAuctions()
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        
        const originalLength = auctions.length
        const filtered = auctions.filter(a => 
            a.status === "active" || a.endTime > oneWeekAgo
        )
        
        if (filtered.length < originalLength) {
            this.saveAuctions(filtered)
            console.log(`Cleaned up ${originalLength - filtered.length} old auctions`)
        }
    }
}
