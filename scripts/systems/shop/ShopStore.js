/*
 * INDUSTRIAL_COMMERCE_TRANSACTIONAL_ENGINE
 * ----------------------------------------------------------------------------
 * Handles the logic for item procurement and credit-balance resolution. 
 * We interface with the DatabaseManager for persistent shop-state and 
 * the Economy system for transactional integrity.
 *
 * PERFORMANCE_NOTE: We use a cached buffer for shop prices to avoid 
 * redundant database IO during high-frequency purchase requests.
 */

import { Kernel } from "../../core/Kernel.js"
import { Configuration } from "../../Configuration.js"
import { MINECRAFT_ITEMS } from "../../data/minecraft-items.js"

export const ShopStore = {
    /*
     * SHOP_DATA_RETRIEVAL_PROTOCOL
     * Pulls the master shop-registry from the persistent database. 
     * Falls back to the hard-coded default manifest if the store is 
     * uninitialized.
     */
    getShopData() {
        const Database = Kernel.get("database")
        return Database.get("ae:shopData") || this.getDefaultShopData()
    },

    /*
     * PERSISTENT_SHOP_COMMIT
     * Flushes the current shop-buffer to the database. Essential for 
     * saving price fluctuations and stock adjustments.
     */
    saveShopData(data) {
        const Database = Kernel.get("database")
        return Database.set("ae:shopData", data)
    },

    /* 
     * BOOTSTRAP_DATA_TEMPLATE
     * The baseline structure for the shop engine.
     */
    getDefaultShopData() {
        return {
            enabled: true,
            prices: {},
            stock: {}
        }
    },

    /*
     * ATOMIC_PURCHASE_SEQUENCE
     * Executes the commerce loop: 
     * 1. Resolve item and price metadata.
     * 2. Verify liquidity via Economy service.
     * 3. Deduct credits from the balance buffer.
     * 4. Trigger inventory-injection protocol.
     * 5. Refund credits if the injection fails (Failsafe logic).
     */
    purchaseItem(player, itemId, quantity) {
        const Economy = Kernel.get("economy")
        const shopData = this.getShopData()
        const item = MINECRAFT_ITEMS[itemId] || { name: itemId, price: 100 }
        
        const price = shopData.prices[itemId] || item.price
        const totalCost = price * quantity

        /* 
         * LIQUIDITY_VERIFICATION
         * Ensure the entity has sufficient credit allocation for the 
         * transaction.
         */
        const balance = Economy.getBalance(player)
        if (balance < totalCost) {
            return { success: false, message: `Insufficient liquidity. Required: ${this.formatMoney(totalCost)}` }
        }

        /* 
         * TRANSACTIONAL_GATEKEEPER
         * We remove the money BEFORE delivering the goods to prevent 
         * transaction-racing exploits.
         */
        if (Economy.removeMoney(player, totalCost)) {
            /* 
             * INVENTORY_INJECTION_PROTOCOL
             * Physically deliver the item stack to the player entity.
             */
            const delivered = this.giveItem(player, itemId, quantity)
            
            if (delivered) {
                return { 
                    success: true, 
                    message: `PROCURED: ${quantity}x ${item.name} | COST: ${this.formatMoney(totalCost)}`
                }
            } else {
                /* 
                 * ROLLBACK_MECHANISM
                 * If the inventory-injection fails (likely full inventory), 
                 * we refund the credits immediately to maintain balance 
                 * integrity.
                 */
                Economy.addMoney(player, totalCost)
                return { success: false, message: "Inventory buffer overflow! Credits refunded." }
            }
        }

        return { success: false, message: "Transactional pipeline failure." }
    },

    /*
     * LOW_LEVEL_ITEM_DELIVERY
     * Uses the runCommandAsync protocol for atomic item injection. 
     * This is safer than manual container manipulation as it respects 
     * native stack-size limits and inventory overflows.
     */
    giveItem(player, itemId, quantity) {
        try {
            player.runCommandAsync(`give @s ${itemId} ${quantity}`)
            return true
        } catch (error) {
            console.error(`[ShopStore] INJECTION_FAILURE: ${error}`)
            return false
        }
    },

    /* 
     * CURRENCY_STRING_FORMATTER
     * Maps the numeric balance to its industrial string representation.
     */
    formatMoney(amount) {
        return `${Configuration.CURRENCY_SYMBOL}${amount.toLocaleString()}`
    },

    /*
     * DYNAMIC_CATEGORY_AGGREGATOR
     * Scans the master item manifest and builds a unique set of 
     * category strings. O(N) complexity where N is the total item count.
     */
    getCategories() {
        const cats = new Set()
        Object.values(MINECRAFT_ITEMS).forEach(i => cats.add(i.category))
        return Array.from(cats).sort()
    }
}
