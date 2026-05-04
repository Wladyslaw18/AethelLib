/**
 * Sell Store - Manages item selling prices and transactions
 */

import { world } from "@minecraft/server"
import { MINECRAFT_ITEMS } from "../../data/minecraft-items.js"

export class SellStore {
    static getSellPrices() {
        try {
            const stored = world.getDynamicProperty("ae:sellPrices")
            return stored ? JSON.parse(stored) : this.getDefaultSellPrices()
        } catch (error) {
            console.error(`Failed to load sell prices: ${error}`)
            return this.getDefaultSellPrices()
        }
    }

    static saveSellPrices(prices) {
        try {
            world.setDynamicProperty("ae:sellPrices", JSON.stringify(prices))
            return true
        } catch (error) {
            console.error(`Failed to save sell prices: ${error}`)
            return false
        }
    }

    static getDefaultSellPrices() {
        // Default sell prices are 50% of shop prices
        const prices = {}
        Object.entries(MINECRAFT_ITEMS).forEach(([id, item]) => {
            prices[id] = Math.floor(item.price * 0.5)
        })
        return prices
    }

    static getSellPrice(itemId) {
        const prices = this.getSellPrices()
        return prices[itemId] || 0
    }

    static updateSellPrice(itemId, price) {
        if (!MINECRAFT_ITEMS[itemId]) return false
        
        const prices = this.getSellPrices()
        prices[itemId] = Math.max(0, price)
        return this.saveSellPrices(prices)
    }

    static sellItem(player, itemId, quantity) {
        const item = MINECRAFT_ITEMS[itemId]
        if (!item) {
            return { success: false, message: "Item cannot be sold" }
        }

        const sellPrice = this.getSellPrice(itemId)
        if (sellPrice <= 0) {
            return { success: false, message: "This item has no sell value" }
        }

        // Check if player has enough items
        const playerQuantity = this.getPlayerItemCount(player, itemId)
        if (playerQuantity < quantity) {
            return { success: false, message: `You don't have enough ${item.name}. Have ${playerQuantity}, need ${quantity}` }
        }

        const totalValue = sellPrice * quantity

        // Remove items from player inventory
        if (!this.removePlayerItems(player, itemId, quantity)) {
            return { success: false, message: "Failed to remove items from inventory" }
        }

        // Add money to player
        if (!this.addPlayerMoney(player.id, totalValue)) {
            // Refund items if money addition fails
            this.givePlayerItems(player, itemId, quantity)
            return { success: false, message: "Failed to add money to your account" }
        }

        // Log transaction
        this.logTransaction(player.id, itemId, quantity, sellPrice, totalValue)

        return {
            success: true,
            message: `Sold ${quantity}x ${item.name} for §6$§e${totalValue.toLocaleString()}`,
            item: item,
            quantity: quantity,
            totalValue: totalValue
        }
    }

    static getPlayerItemCount(player, itemId) {
        try {
            const container = player.getComponent("inventory").container
            let count = 0

            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i)
                if (item && item.typeId === itemId) {
                    count += item.amount
                }
            }

            return count
        } catch (error) {
            console.error(`Failed to get player item count: ${error}`)
            return 0
        }
    }

    static removePlayerItems(player, itemId, quantity) {
        try {
            const container = player.getComponent("inventory").container
            let remaining = quantity

            for (let i = 0; i < container.size && remaining > 0; i++) {
                const item = container.getItem(i)
                if (item && item.typeId === itemId) {
                    const toRemove = Math.min(item.amount, remaining)
                    item.amount -= toRemove
                    remaining -= toRemove

                    if (item.amount <= 0) {
                        container.setItem(i, undefined)
                    } else {
                        container.setItem(i, item)
                    }
                }
            }

            return remaining === 0
        } catch (error) {
            console.error(`Failed to remove player items: ${error}`)
            return false
        }
    }

    static givePlayerItems(player, itemId, quantity) {
        // Placeholder implementation
        player.sendMessage(`§aRefunded ${quantity}x ${itemId}`)
        return true
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

    static getPlayerBalance(playerId) {
        try {
            const balance = world.getDynamicProperty(`ae:balance:${playerId}`)
            return balance || 0
        } catch (error) {
            console.error(`Failed to get player balance: ${error}`)
            return 0
        }
    }

    static logTransaction(playerId, itemId, quantity, unitPrice, totalValue) {
        try {
            const transactions = this.getTransactions()
            const transaction = {
                id: this.generateTransactionId(),
                playerId: playerId,
                itemId: itemId,
                quantity: quantity,
                unitPrice: unitPrice,
                totalValue: totalValue,
                timestamp: Date.now(),
                type: "sell"
            }

            transactions.push(transaction)
            
            // Keep only last 1000 transactions
            if (transactions.length > 1000) {
                transactions.splice(0, transactions.length - 1000)
            }

            world.setDynamicProperty("ae:sellTransactions", JSON.stringify(transactions))
        } catch (error) {
            console.error(`Failed to log transaction: ${error}`)
        }
    }

    static getTransactions() {
        try {
            const stored = world.getDynamicProperty("ae:sellTransactions")
            return stored ? JSON.parse(stored) : []
        } catch (error) {
            console.error(`Failed to load transactions: ${error}`)
            return []
        }
    }

    static generateTransactionId() {
        return `sell_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    }

    static getPlayerTransactions(playerId, limit = 50) {
        const allTransactions = this.getTransactions()
        return allTransactions
            .filter(tx => tx.playerId === playerId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit)
    }

    static getSellStats() {
        const transactions = this.getTransactions()
        const recentTransactions = transactions.filter(tx => 
            tx.type === "sell" && 
            (Date.now() - tx.timestamp) < 24 * 60 * 60 * 1000 // Last 24 hours
        )

        const totalSold = recentTransactions.reduce((sum, tx) => sum + tx.totalValue, 0)
        const itemsSold = recentTransactions.reduce((sum, tx) => sum + tx.quantity, 0)
        const uniqueItems = new Set(recentTransactions.map(tx => tx.itemId)).size

        return {
            totalSold,
            itemsSold,
            uniqueItems,
            transactions: recentTransactions.length
        }
    }

    static formatMoney(amount) {
        return `§6$§e${amount.toLocaleString()}`
    }
}
