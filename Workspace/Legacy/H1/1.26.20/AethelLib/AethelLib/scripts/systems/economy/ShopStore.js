/*
 * INDUSTRIAL_SHOP_REGISTRY
 * ----------------------------------------------------------------------------
 * A dynamic, manifest-driven repository for trade assets. 
 * This system operates as an empty vector by default, allowing for 
 * external calibration via the ShopStore.register() protocol.
 *
 * PHILOSOPHY: The economy is a sandbox. We provide the infrastructure; 
 * modders provide the assets.
 */

export class ShopStore {
    /** @type {Array<{id: string, name: string, category: string, buy: number, sell: number}>} */
    static items = []

    /**
     * REGISTRY_INJECTION_PROTOCOL
     * Registers a new asset node into the shop manifest.
     * @param {Object} item 
     */
    static register(item) {
        if (!item.id || !item.name || !item.category) {
            console.warn(`[ShopStore] REJECTED: Invalid asset node: ${JSON.stringify(item)}`)
            return
        }
        this.items.push({
            id: item.id,
            name: item.name,
            category: item.category.toUpperCase(),
            buy: item.buy ?? 0,
            sell: item.sell ?? 0
        })
    }

    /**
     * BATCH_INJECTION_PROTOCOL
     * Loads a full manifest into the registry.
     * @param {Array} manifest 
     */
    static loadManifest(manifest) {
        if (!Array.isArray(manifest)) return
        manifest.forEach(item => this.register(item))
    }

    /**
     * REGISTRY_RESET_PROTOCOL
     */
    static clear() {
        this.items = []
    }

    /**
     * ASSET_QUERY_PROTOCOL
     */
    static getItems() {
        return this.items
    }

    /**
     * CATEGORY_QUERY_PROTOCOL
     */
    static getByCategory(category) {
        return this.items.filter(item => item.category === category.toUpperCase())
    }
}

