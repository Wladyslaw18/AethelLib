import { Kernel } from "../../core/Kernel.js";
import { MINECRAFT_ITEMS } from "../../data/minecraft-items.js";

/**
 * Resolves the unit price of a given item, supporting database overrides and fallbacks.
 * @param {string} itemId 
 * @param {number} depth Recursion depth guard
 * @returns {number} Unit price
 */
export function getBasePrice(itemId, depth = 0) {
    if (!itemId || typeof itemId !== "string") return 100;
    if (depth > 5) return 100;
    
    const Database = Kernel.get("database");
    
    // Normalize namespace prefix
    const fullId = itemId.includes(":") ? itemId : `minecraft:${itemId}`;
    const cleanId = fullId.replace("minecraft:", "");

    // 1. Check database overrides
    const dbPrice = Database?.get(`shop:price:${fullId}`);
    if (dbPrice !== null && dbPrice !== undefined && typeof dbPrice === "number") {
        return dbPrice;
    }

    // 2. Check hardcoded presets
    if (MINECRAFT_ITEMS[fullId]?.price !== undefined) {
        return MINECRAFT_ITEMS[fullId].price;
    }

    // 3. Block conversion (material * 9)
    if (cleanId.endsWith("_block")) {
        const baseMaterial = cleanId.substring(0, cleanId.length - 6);
        const materialPrice = getBasePrice(`minecraft:${baseMaterial}`, depth + 1);
        if (materialPrice > 0) return materialPrice * 9;
    }

    // 4. Slab conversion (base block * 0.75)
    if (cleanId.endsWith("_slab")) {
        const baseBlock = cleanId.substring(0, cleanId.length - 5);
        const blockPrice = getBasePrice(`minecraft:${baseBlock}`, depth + 1);
        if (blockPrice > 0) return Math.floor(blockPrice * 0.75);
    }

    // 5. Stairs conversion (base block * 1.5)
    if (cleanId.endsWith("_stairs")) {
        const baseBlock = cleanId.substring(0, cleanId.length - 7);
        const blockPrice = getBasePrice(`minecraft:${baseBlock}`, depth + 1);
        if (blockPrice > 0) return Math.floor(blockPrice * 1.5);
    }

    // 6. Generic Fallback
    return 100;
}

/**
 * Resolves the total price for a given quantity.
 */
export function getItemPrice(itemId, quantity = 1) {
    return getBasePrice(itemId) * quantity;
}

/**
 * Normalizes item display names.
 */
export function getItemDisplayName(itemId) {
    const fullId = itemId.includes(":") ? itemId : `minecraft:${itemId}`;
    if (MINECRAFT_ITEMS[fullId]?.name) {
        return MINECRAFT_ITEMS[fullId].name;
    }
    
    const clean = fullId.replace("minecraft:", "").replace(/_/g, " ");
    return clean.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Fuzzy search across name and ID keys.
 */
export function searchItems(query) {
    const cleanQuery = query.toLowerCase();
    const results = [];

    for (const [id, meta] of Object.entries(MINECRAFT_ITEMS)) {
        const displayName = meta.name.toLowerCase();
        const cleanId = id.replace("minecraft:", "").toLowerCase();
        if (displayName.includes(cleanQuery) || cleanId.includes(cleanQuery)) {
            results.push({ id, name: meta.name, price: getBasePrice(id) });
        }
    }
    return results;
}

/**
 * Filter items by mapping autocomplete enums to hardcoded categories.
 */
export function getItemsByCategory(category) {
    const lowerCat = category.toLowerCase();
    const results = [];

    const categoryMap = {
        weapons: ["sword", "axe", "bow", "crossbow", "trident", "mace", "shield"],
        armor: ["helmet", "chestplate", "leggings", "boots", "elytra"],
        tools: ["pickaxe", "shovel", "hoe", "fishing_rod", "shears", "brush", "flint_and_steel"],
        blocks: ["building", "nature"],
        materials: ["materials"],
        food: ["food"],
        potions: ["potions", "misc"],
        misc: ["misc", "functional", "redstone", "admin"]
    };

    const targetCategories = categoryMap[lowerCat] || [lowerCat];

    for (const [id, meta] of Object.entries(MINECRAFT_ITEMS)) {
        const itemCat = meta.category?.toLowerCase() || "misc";
        let match = targetCategories.includes(itemCat);

        // Substring check for custom categorization rules
        if (lowerCat === "weapons") {
            match = categoryMap.weapons.some(kw => id.includes(kw));
        } else if (lowerCat === "potions") {
            match = id.includes("potion") || id.includes("bottle") || id.includes("pearl");
        }

        if (match) {
            results.push({ id, name: meta.name, price: getBasePrice(id) });
        }
    }
    return results;
}

/**
 * Starts the periodic recovery scheduler that decays trade supply volumes.
 * Runs every 5 minutes (6000 ticks).
 */
export function startMarketRecoveryJob() {
    Kernel.system.runInterval(() => {
        const Database = Kernel.get("database")
        if (!Database) return

        const active = Database.get("market:active_items") || []
        const nextActive = []

        for (const itemId of active) {
            const vol = Database.get(`shop:volume:${itemId}`) || 0
            if (vol > 0) {
                // 10% decay every 5 minutes
                const nextVol = Math.floor(vol * 0.9)
                if (nextVol > 0) {
                    Database.set(`shop:volume:${itemId}`, nextVol)
                    nextActive.push(itemId)
                } else {
                    Database.delete(`shop:volume:${itemId}`)
                }
            }
        }
        Database.set("market:active_items", nextActive)
        console.log(`[Shop] Dynamic supply decay recovery sweep processed ${active.length} active nodes.`);
    }, 6000)
}
