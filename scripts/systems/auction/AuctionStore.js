import { world } from "@minecraft/server"

/*
 * INDUSTRIAL_AUCTION_ORCHESTRATOR
 * ----------------------------------------------------------------------------
 * A high-performance orchestration layer for the global trade-manifest. 
 * Manages the persistence, bidding-vectors, and atomic settlement of 
 * industrial asset auctions. 
 *
 * PHILOSOPHY: Trade is the engine of the empire. This module ensures 
 * the integrity of the global trade-registry and prevents liquidity-leaks 
 * during settlement.
 */
export class AuctionStore {
    /* 
     * GLOBAL_MANIFEST_QUERY
     */
    static getAuctions() {
        try {
            const stored = world.getDynamicProperty("ae:auctions")
            return stored ? JSON.parse(String(stored)) : []
        } catch (error) {
            console.error(`[AuctionStore] MANIFEST_LOAD_FAILURE: ${error}`)
            return []
        }
    }

    /* 
     * MANIFEST_COMMIT_PROTOCOL
     */
    static saveAuctions(auctions) {
        try {
            world.setDynamicProperty("ae:auctions", JSON.stringify(auctions))
            return true
        } catch (error) {
            console.error(`[AuctionStore] MANIFEST_SAVE_FAILURE: ${error}`)
            return false
        }
    }

    /* 
     * AUCTION_INJECTION_VECTOR
     */
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

    /* 
     * BID_CALIBRATION_PROTOCOL
     * Orchestrates the placement of a bid-node on an active auction. 
     * Implements an atomic refund-vector for the previous bidder.
     */
    static placeBid(auctionId, bidderId, bidderName, bidAmount) {
        const auctions = this.getAuctions()
        const auction = auctions.find(a => a.id === auctionId)

        if (!auction) return { success: false, message: "AUCTION_NOT_FOUND" }
        if (auction.status !== "active") return { success: false, message: "AUCTION_INACTIVE" }
        if (Date.now() > auction.endTime) return { success: false, message: "AUCTION_EXPIRED" }
        if (auction.sellerId === bidderId) return { success: false, message: "SELF_BIDDING_PROHIBITED" }
        if (bidAmount <= auction.currentBid) return { success: false, message: `INSUFFICIENT_BID: MIN_BID: ${auction.currentBid + 1}` }

        if (auction.currentBidder && auction.currentBidder !== bidderId) {
            this.refundBid(auction.currentBidder, auction.currentBid)
        }

        auction.currentBid = bidAmount
        auction.currentBidder = bidderId
        auction.currentBidderName = bidderName

        this.saveAuctions(auctions)
        return { success: true, message: "BID_ACCEPTED", auction: auction }
    }

    /* 
     * IMMEDIATE_ACQUISITION_PROTOCOL
     */
    static buyNow(auctionId, buyerId, buyerName) {
        const auctions = this.getAuctions()
        const auction = auctions.find(a => a.id === auctionId)

        if (!auction) return { success: false, message: "AUCTION_NOT_FOUND" }
        if (auction.status !== "active") return { success: false, message: "AUCTION_INACTIVE" }
        if (!auction.buyNowPrice || auction.buyNowPrice <= 0) return { success: false, message: "ACQUISITION_VECTOR_UNAVAILABLE" }
        if (auction.sellerId === buyerId) return { success: false, message: "SELF_ACQUISITION_PROHIBITED" }

        const buyerBalance = this.getPlayerBalance(buyerId)
        if (buyerBalance < auction.buyNowPrice) return { success: false, message: "INSUFFICIENT_LIQUIDITY" }

        if (!this.removePlayerMoney(buyerId, auction.buyNowPrice)) return { success: false, message: "PAYMENT_ORCHESTRATION_FAILURE" }

        this.addPlayerMoney(auction.sellerId, auction.buyNowPrice)

        auction.status = "sold"
        auction.buyerId = buyerId
        auction.buyerName = buyerName
        auction.finalPrice = auction.buyNowPrice

        this.saveAuctions(auctions)
        return { success: true, message: "ACQUISITION_COMPLETE", auction: auction }
    }

    /* 
     * TEMPORAL_SETTLEMENT_PROTOCOL
     * Scans the manifest for expired auctions and orchestrates final 
     * state-transitions and payouts.
     */
    static endExpiredAuctions() {
        const auctions = this.getAuctions()
        const now = Date.now()
        let endedAuctions = []

        auctions.forEach(auction => {
            if (auction.status === "active" && now > auction.endTime) {
                if (auction.currentBidder) {
                    this.addPlayerMoney(auction.sellerId, auction.currentBid)
                    auction.status = "sold"
                    auction.buyerId = auction.currentBidder
                    auction.buyerName = auction.currentBidderName
                    auction.finalPrice = auction.currentBid
                } else {
                    auction.status = "expired"
                }
                endedAuctions.push(auction)
            }
        })

        if (endedAuctions.length > 0) this.saveAuctions(auctions)
        return endedAuctions
    }

    /* 
     * MANIFEST_QUERY_VECTORS
     */
    static getPlayerAuctions(playerId) {
        return this.getAuctions().filter(a => a.sellerId === playerId)
    }

    static getActiveAuctions(limit = 45) {
        return this.getAuctions()
            .filter(a => a.status === "active")
            .sort((a, b) => b.endTime - a.endTime)
            .slice(0, limit)
    }

    /* 
     * LIQUIDITY_RESTORATION_VECTOR
     */
    static refundBid(playerId, amount) {
        this.addPlayerMoney(playerId, amount)
    }

    /* 
     * LIQUIDITY_QUERY_VECTOR
     */
    static getPlayerBalance(playerId) {
        try {
            const balance = world.getDynamicProperty(`ae:balance:${playerId}`)
            return Number(balance) || 0
        } catch (error) {
            console.error(`[AuctionStore] BALANCE_QUERY_FAILURE: ${error}`)
            return 0
        }
    }

    /* 
     * LIQUIDITY_MUTATION_VECTORS
     */
    static addPlayerMoney(playerId, amount) {
        try {
            const currentBalance = this.getPlayerBalance(playerId)
            world.setDynamicProperty(`ae:balance:${playerId}`, currentBalance + amount)
            return true
        } catch (error) {
            console.error(`[AuctionStore] LIQUIDITY_INJECTION_FAILURE: ${error}`)
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
            console.error(`[AuctionStore] LIQUIDITY_EXTRACTION_FAILURE: ${error}`)
            return false
        }
    }

    /* 
     * IDENTIFIER_GENERATION_PROTOCOL
     */
    static generateAuctionId() {
        return `AUCTION_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }

    /* 
     * TEMPORAL_DURATION_RESOLVER
     */
    static getTimeRemaining(endTime) {
        const now = Date.now()
        const remaining = Math.max(0, endTime - now)
        if (remaining === 0) return "SETTLED"
        const hours = Math.floor(remaining / (1000 * 60 * 60))
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
        return hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
    }

    /* 
     * MAINTENANCE_PURGE_PROTOCOL
     * Decommissions stale auction nodes from the global manifest to 
     * reclaim memory-heap.
     */
    static cleanupOldAuctions() {
        const auctions = this.getAuctions()
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        const originalLength = auctions.length
        const filtered = auctions.filter(a => a.status === "active" || a.endTime > oneWeekAgo)
        if (filtered.length < originalLength) {
            this.saveAuctions(filtered)
            console.log(`[AuctionStore] PURGE_COMPLETE: ${originalLength - filtered.length} stale nodes decommissioned.`);
        }
    }
}
