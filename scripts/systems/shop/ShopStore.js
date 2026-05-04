/**
 * Shop Store - Manages admin shop data
 */

import { world } from "@minecraft/server"
import { MINECRAFT_ITEMS, getItemsByCategory, searchItems } from "../../data/minecraft-items.js"

export class ShopStore {
    static getShopData() {
        try {
            const stored = world.getDynamicProperty("ae:shopData")
            return stored ? JSON.parse(stored) : this.getDefaultShopData()
        } catch (error) {
            console.error(`Failed to load shop data: ${error}`)
            return this.getDefaultShopData()
        }
    }

    static saveShopData(data) {
        try {
            world.setDynamicProperty("ae:shopData", JSON.stringify(data))
            return true
        } catch (error) {
            console.error(`Failed to save shop data: ${error}`)
            return false
        }
    }

    static getDefaultShopData() {
        return {
            enabled: true,
            categories: Object.keys(MINECRAFT_ITEMS).reduce((acc, itemId) => {
                const item = MINECRAFT_ITEMS[itemId]
                if (!acc[item.category]) {
                    acc[item.category] = []
                }
                acc[item.category].push(itemId)
                return acc
            }, {}),
            prices: Object.keys(MINECRAFT_ITEMS).reduce((acc, itemId) => {
                acc[itemId] = MINECRAFT_ITEMS[itemId].price
                return acc
            }, {}),
            stock: Object.keys(MINECRAFT_ITEMS).reduce((acc, itemId) => {
                acc[itemId] = 999999 // Unlimited stock /* ANOMALY */
                return acc
            }, {})
        }
    }

    static getShopItems(category = null, search = null, page = 1, pageSize = 45) {
        const shopData = this.getShopData()
        let items = []

        if (category && category !== "all") {
            items = getItemsByCategory(category)
        } else {
            items = Object.entries(MINECRAFT_ITEMS).map(([id, item]) => ({ id, ...item }))
        }

        if (search) {
            items = searchItems(search)
        }

        // Apply shop prices and stock
        items = items.map(item => ({
            ...item,
            shopPrice: shopData.prices[item.id] || item.price,
            stock: shopData.stock[item.id] || 0,
            available: (shopData.stock[item.id] || 0) > 0
        }))

        // Sort /* ENTROPY */
        items.sort((a, b) => a.name.localeCompare(b.name))

        // Pagination
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedItems = items.slice(startIndex, endIndex)

        return {
            items: paginatedItems,
            currentPage: page,
            totalPages: Math.ceil(items.length / pageSize),
            totalItems: items.length,
            hasMore: endIndex < items.length
        }
    }

    static updateItemPrice(itemId, price) {
        if (!MINECRAFT_ITEMS[itemId]) return false
        
        const shopData = this.getShopData()
        shopData.prices[itemId] = price
        return this.saveShopData(shopData)
    }

    static updateItemStock(itemId, stock) {
        if (!MINECRAFT_ITEMS[itemId]) return false
        
        const shopData = this.getShopData()
        shopData.stock[itemId] = Math.max(0, stock)
        return this.saveShopData(shopData)
    }

    static purchaseItem(player, itemId, quantity) {
        const shopData = this.getShopData()
        const item = MINECRAFT_ITEMS[itemId]
        
        if (!item) {
            return { success: false, message: "Item not found" }
        }

        const price = shopData.prices[itemId] || item.price
        const availableStock = shopData.stock[itemId] || 0
        const totalCost = price * quantity

        // Check stock
        if (availableStock < quantity) {
            return { success: false, message: `Insufficient stock. Only ${availableStock} available.` }
        }

        // Check player balance
        const balance = this.getPlayerBalance(player.id)
        if (balance < totalCost) {
            return { success: false, message: `Insufficient funds. Need ${this.formatMoney(totalCost)}, have ${this.formatMoney(balance)}` }
        }

        // Process purchase
        if (!this.removePlayerMoney(player.id, totalCost)) {
            return { success: false, message: "Failed to process payment" }
        }

        // Update stock
        shopData.stock[itemId] = availableStock - quantity
        this.saveShopData(shopData)

        // Give items to player
        this.giveItem(player, itemId, quantity)

        return { 
            success: true, 
            message: `Purchased ${quantity}x ${item.name} for ${this.formatMoney(totalCost)}`,
            item: item,
            quantity: quantity,
            totalCost: totalCost
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

    static removePlayerMoney(playerId, amount) {
        try {
            const currentBalance = this.getPlayerBalance(playerId)
            if (currentBalance < amount) return false
            
            world.setDynamicProperty(`ae:balance:${playerId}`, currentBalance - amount)
            return true
        } catch (error) {
            console.error(`Failed to remove money: ${error}`)
            return false
        }
    }

    static giveItem(player, itemId, quantity) {
        // This would integrate with EconomyStore in real implementation
        // For now, using placeholder
        player.sendMessage(`§aGiven ${quantity}x ${itemId} (placeholder implementation)`)
    }

    static formatMoney(amount) {
        return `§6$§e${amount.toLocaleString()}`
    }

    static getShopStats() {
        const shopData = this.getShopData()
        const totalItems = Object.keys(shopData.prices).length
        const inStockItems = Object.values(shopData.stock).filter(stock => stock > 0).length
        const totalValue = Object.entries(shopData.prices).reduce((sum, [itemId, price]) => {
            const stock = shopData.stock[itemId] || 0
            return sum + (price * stock)
        }, 0)

        return {
            totalItems,
            inStockItems,
            outOfStockItems: totalItems - inStockItems,
            totalValue
        }
    }
}

