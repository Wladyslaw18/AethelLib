import { Kernel } from "../../core/Kernel.js"
import { Configuration } from "../../Configuration.js"
import { MINECRAFT_ITEMS } from "../../data/minecraft-items.js"

// ----------------------------------------------------------------------------
// | ShopStore                                                                 |
// | handles the server's virtual storefront.                                   |
// | processes item purchases, price resolution, and transactional safety.     |
// | if the player's inventory is full, we handle refunds so nobody gets scammed.|
// ----------------------------------------------------------------------------

export const ShopStore = {
    // ----------------------------------------------------------------------------
    // | getShopData                                                              |
    // | fetches global shop settings and pricing overrides from the database.    |
    // ----------------------------------------------------------------------------
    getShopData() {
        const Database = Kernel.get("database")
        // try to load the 'ae:shopData' key. if it's missing, use the default structure.
        return Database.get("ae:shopData") || this.getDefaultShopData()
    },

    // ----------------------------------------------------------------------------
    // | saveShopData                                                              |
    // | persists shop settings to the world storage.                             |
    // ----------------------------------------------------------------------------
    saveShopData(data) {
        const Database = Kernel.get("database")
        return Database.set("ae:shopData", data)
    },

    // ----------------------------------------------------------------------------
    // | getDefaultShopData                                                       |
    // | returns the baseline configuration for a fresh shop.                     |
    // ----------------------------------------------------------------------------
    getDefaultShopData() {
        return {
            // is the shop actually open?
            enabled: true,
            // manual price overrides.
            prices: {},
            // track virtual stock (currently unused, but the hook is there).
            stock: {}
        }
    },

    // ----------------------------------------------------------------------------
    // | purchaseItem                                                             |
    // | the core transactional flow for buying items.                            |
    // | 1. resolve price.                                                        |
    // | 2. check if the player is broke.                                         |
    // | 3. take the money (pessimistic lock).                                    |
    // | 4. try to give the item.                                                 |
    // | 5. if giving the item fails, refund the money immediately.               |
    // ----------------------------------------------------------------------------
    async purchaseItem(player, itemId, quantity) {
        // get the economy service and database from the kernel.
        const Economy = Kernel.get("economy")
        const Database = Kernel.get("database")
        
        // price resolution logic.
        // first, check if there is a custom price set in the database for this item.
        let price = Database.get(`shop:price:${itemId}`)
        if (price === null) {
            // if no override, check our hardcoded item data list. 
            // if it's missing there too, default to 100 credits.
            price = MINECRAFT_ITEMS[itemId]?.price || 100
        }
        
        // calculate the final bill.
        const totalCost = price * quantity

        // check if the player actually has the funds.
        const balance = Economy.getBalance(player)
        if (balance < totalCost) {
            // bail early if they can't afford it.
            return { success: false, message: `Insufficient liquidity. Required: ${this.formatMoney(totalCost)}` }
        }

        // subtract the money first. this prevents players from spending the same credits twice
        // if they try to buy something else while this is processing.
        const paymentSuccess = await Economy.removeMoney(player, totalCost)
        if (paymentSuccess) {
            // try to drop the items into the player's inventory.
            const delivered = this.giveItem(player, itemId, quantity)
            
            if (delivered) {
                // transaction complete.
                return { 
                    success: true, 
                    message: `PROCURED: ${quantity}x ${itemId.split(":")[1].toUpperCase()} | COST: ${this.formatMoney(totalCost)}`
                }
            } else {
                // if we couldn't give the item (e.g. inventory overflow or engine error).
                // we MUST give the money back. nobody likes getting scammed by a computer.
                await Economy.addMoney(player, totalCost)
                return { success: false, message: "Inventory buffer overflow! Credits refunded." }
            }
        }

        // if the economy subtraction failed for some internal reason.
        return { success: false, message: "Transactional pipeline failure." }
    },

    // ----------------------------------------------------------------------------
    // | giveItem                                                                 |
    // | internal helper to physically hand an item to a player.                  |
    // | uses the native 'give' command because it handles stack limits and        |
    // | overflow better than manual container logic.                             |
    // ----------------------------------------------------------------------------
    giveItem(player, itemId, quantity) {
        try {
            // execute the give command on the player.
            /* try */ player.runCommand(`give @s ${itemId} ${quantity}`)
            return true
        } catch (error) {
            // if the command fails, log it. usually means a malformed item id.
            console.error(`[ShopStore] failed to give item: ${error}`)
            return false
        }
    },

    // ----------------------------------------------------------------------------
    // | formatMoney                                                              |
    // | converts a number into a pretty string with currency symbols.            |
    // ----------------------------------------------------------------------------
    formatMoney(amount) {
        // use the currency symbol from configuration.
        return `${Configuration.CURRENCY_SYMBOL}${amount.toLocaleString()}`
    },

    // ----------------------------------------------------------------------------
    // | getCategories                                                            |
    // | extracts every unique category from our master item list.                |
    // | used to build the category selection menu in the shop ui.                |
    // ----------------------------------------------------------------------------
    getCategories() {
        const cats = new Set()
        // iterate through every item and add its category to the set.
        Object.values(MINECRAFT_ITEMS).forEach(i => cats.add(i.category))
        // convert the set to a sorted array and return it.
        return Array.from(cats).sort()
    }
}
