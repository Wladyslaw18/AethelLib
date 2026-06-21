import { Kernel } from "../../core/Kernel.js";
import { ItemStack } from "@minecraft/server";
import { getItemPrice, getItemDisplayName } from "./ShopPrices.js";
import { Lang } from "../../ui/Lang.js";

/**
 * Normalizes item ID.
 */
export function parseItemId(input) {
    return expandItemId(input);
}

function expandItemId(name) {
    let clean = name.trim();
    if (!clean.includes(":")) {
        clean = `minecraft:${clean}`;
    }
    return clean;
}

/**
 * Dynamically queries an item's stack size limit.
 */
export function getMaxStackSize(itemId) {
    try {
        const stack = new ItemStack(itemId, 1);
        return stack.maxAmount;
    } catch (e) {
        return 64; // Default fallback
    }
}

/**
 * Calculates the total available space for a specific item ID in the player's inventory,
 * accounting for both completely empty slots and partially filled stacks.
 */
export function getAvailableSpace(inventory, itemId) {
    try {
        const maxStack = getMaxStackSize(itemId);
        let space = 0;
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (!item) {
                space += maxStack;
            } else if (item.typeId === itemId) {
                space += Math.max(0, maxStack - item.amount);
            }
        }
        return space;
    } catch (e) {
        console.error("[Shop] Error calculating available inventory space: " + e);
        return 0;
    }
}

/**
 * Verifies if the player's inventory has enough space to accommodate a set of item demands.
 * @param {Container} inventory 
 * @param {Map<string, number> | Record<string, number>} demands - Map or object of itemId -> quantity
 * @returns {boolean} True if all items can fit, false otherwise.
 */
export function hasInventorySpace(inventory, demands) {
    try {
        const demandList = demands instanceof Map ? Array.from(demands.entries()) : Object.entries(demands);
        const slots = [];
        
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item) {
                slots.push({
                    typeId: item.typeId,
                    amount: item.amount,
                    maxStack: item.maxAmount || getMaxStackSize(item.typeId)
                });
            } else {
                slots.push({
                    typeId: null,
                    amount: 0,
                    maxStack: 64
                });
            }
        }

        for (const [rawId, qty] of demandList) {
            if (qty <= 0) continue;
            const itemId = rawId.includes(":") ? rawId : `minecraft:${rawId}`;
            const maxStack = getMaxStackSize(itemId);
            let remainingQty = qty;

            // Step A: Fill existing partial stacks of the same type first
            for (const slot of slots) {
                if (slot.typeId === itemId && slot.amount < slot.maxStack) {
                    const space = slot.maxStack - slot.amount;
                    const toAdd = Math.min(remainingQty, space);
                    slot.amount += toAdd;
                    remainingQty -= toAdd;
                    if (remainingQty <= 0) break;
                }
            }

            // Step B: Fill empty slots
            if (remainingQty > 0) {
                for (const slot of slots) {
                    if (slot.typeId === null) {
                        const toAdd = Math.min(remainingQty, maxStack);
                        slot.typeId = itemId;
                        slot.amount = toAdd;
                        slot.maxStack = maxStack;
                        remainingQty -= toAdd;
                        if (remainingQty <= 0) break;
                    }
                }
            }

            if (remainingQty > 0) {
                return false;
            }
        }

        return true;
    } catch (e) {
        console.error("[Shop] Error in hasInventorySpace: " + e);
        return false;
    }
}

/**
 * Executes a purchase transaction after authorization.
 */
export async function executeBuyTransaction(player, itemId, quantity) {
    const EconomyStore = Kernel.get("economy");
    const totalCost = getItemPrice(itemId, quantity);
    const itemName = getItemDisplayName(itemId);

    console.warn(`[Shop] [✦] Starting buy transaction: player=${player.name}, item=${itemId}, qty=${quantity}, cost=${totalCost}`);

    // Final checks (under locking)
    const balance = EconomyStore.getBalance(player);
    if (balance < totalCost) {
        console.warn(`[Shop] [✦] Transaction aborted: player=${player.name} has insufficient balance ($${balance} < $${totalCost})`);
        player.sendMessage(`${Lang.PREFIX}§c[X] Transaction failed: Insufficient funds.`);
        return false;
    }

    const inventoryComp = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
    const inventory = inventoryComp?.container;
    if (!inventory) {
        console.warn(`[Shop] [✦] Transaction aborted: player=${player.name} inventory component missing`);
        player.sendMessage(`${Lang.PREFIX}§c[X] Transaction failed: Cannot access inventory.`);
        return false;
    }

    if (!hasInventorySpace(inventory, { [itemId]: quantity })) {
        const availableSpace = getAvailableSpace(inventory, itemId);
        console.warn(`[Shop] [✦] Transaction aborted: player=${player.name} has insufficient inventory space (need=${quantity}, space=${availableSpace})`);
        player.sendMessage(`${Lang.PREFIX}§c[X] Transaction failed: Not enough inventory space. Need space for ${quantity}, but only have space for ${availableSpace}.`);
        return false;
    }

    console.warn(`[Shop] [!] Checks passed. Debiting $${totalCost} from ${player.name}...`);

    // Debit funds
    const debited = await EconomyStore.removeMoney(player, totalCost);
    if (!debited) {
        console.warn(`[Shop] [✦] Transaction aborted: economy debit failed for player=${player.name}`);
        player.sendMessage(`${Lang.PREFIX}§c[X] Transaction failed: Account sync error.`);
        return false;
    }

    console.warn(`[Shop] [✦] Debited successfully. Delivering ${quantity}x ${itemId} to ${player.name}...`);

    // Attempt deliveries
    let remaining = quantity;
    try {
        const maxStack = getMaxStackSize(itemId);
        while (remaining > 0) {
            const amountToGive = Math.min(remaining, maxStack);
            const stack = new ItemStack(itemId, amountToGive);
            const leftover = inventory.addItem(stack);

            if (leftover && leftover.amount > 0) {
                // Return failed amounts, compute refund
                const failed = leftover.amount;
                const refund = getItemPrice(itemId, failed);
                await EconomyStore.addMoney(player, refund);
                
                console.warn(`[Shop] [!] Partial delivery for ${player.name}: delivered=${quantity - remaining + amountToGive - failed}, failed=${failed}, refunded=$${refund}`);
                player.sendMessage(`${Lang.PREFIX}§e[!] Partial Delivery: Delivered ${quantity - remaining + amountToGive - failed}x, refunded $${refund.toLocaleString()}.`);
                return true;
            }
            remaining -= amountToGive;
        }
    } catch (err) {
        // Complete failure safety refund
        await EconomyStore.addMoney(player, totalCost);
        console.warn(`[Shop] [✦] Delivery exception for ${player.name}: ${err.message || err}. Full refund of $${totalCost} processed.`);
        player.sendMessage(`${Lang.PREFIX}§c[X] Delivery system failed. Your account has been refunded.`);
        return false;
    }

    console.warn(`[Shop] [!] Purchase transaction fully completed for ${player.name}: ${quantity}x ${itemId}`);
    player.sendMessage(`${Lang.PREFIX}§a§l[OK] Procured ${quantity}x ${itemName} for §e$${totalCost.toLocaleString()}§a!`);
    return true;
}
