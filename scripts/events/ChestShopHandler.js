import { Kernel } from "../core/Kernel.js"
import { SignSide } from "@minecraft/server"

/*
 * Chest Shop System
 * ----------------------------------------------------------------------------
 * Handles creating and using chest shops (signs attached to chests).
 */


const SHOP_HEADERS = ["[buy]", "[sell]"]

/*
 * EVENT_SUBSCRIPTION_SEQUENCE
 * ----------------------------------------------------------------------------
 * Registers the handler hooks into the world event bus. We monitor 
 * block placement (setup), block interaction (transaction), and block 
 * destruction (security).
 */
export function init() {
    /* 
     * SIGN_PLACEMENT_SENSOR
     * Detects when a player places a sign and attempts to parse the header. 
     * We use a 5-tick deferred scan to allow the client to finish writing 
     * the sign text to the block component.
     */
    Kernel.world.afterEvents.playerPlaceBlock.subscribe((event) => {
        const block = event.block
        const player = event.player
        if (!block || !player) return

        const typeId = block.typeId
        if (!typeId.includes("sign")) return

        Kernel.system.runTimeout(() => {
            if (!block.isValid) return
            try {
                const signComponent = block.getComponent("minecraft:sign")
                if (!signComponent) return

                const frontText = signComponent.getText(SignSide.Front)
                if (frontText === undefined || frontText === null) return

                const firstLine = String(frontText).split("\n")[0]?.toLowerCase()?.trim()
                if (!firstLine || !SHOP_HEADERS.includes(firstLine)) return

                const shopType = firstLine === "[buy]" ? "buy" : "sell"
                const chest = getChestAround(block)

                if (!chest) {
                    player.sendMessage("§c§l» §7No chest found next to the sign!");
                    return
                }


                const ChestShopStore = Kernel.get("chestShopStore")
                const existing = ChestShopStore.findShopByChestLocation(chest.location)
                if (existing) {
                    player.sendMessage("§c§l» §7This chest is already being used for a shop.");
                    return
                }


                showSetupUI(player, shopType, block.location, chest.location)

            } catch (error) {
                console.error(`[ChestShopHandler] SIGN_SCAN_FAILURE: ${error}`)
            }
        }, 5)
    })

    /* 
     * TRANSACTION_INTERACTION_GATE
     * Catches players right-clicking on shop signs. We cancel the 
     * native sign-edit event and trigger the transaction pipeline.
     */
    Kernel.world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        const block = event.block
        const player = event.player
        if (!block || !player) return

        if (!block.typeId.includes("sign")) return

        const ChestShopStore = Kernel.get("chestShopStore")
        const shop = ChestShopStore.getShop(block.location)
        if (!shop) return

        event.cancel = true // TERMINATE_NATIVE_UI

        if (shop.ownerId === player.id) {
            player.sendMessage("§a§l» §fYou own this shop.");
            return
        }


        Kernel.system.run(() => {
            processTransaction(player, shop)
        })
    })

    /* 
     * STRUCTURAL_INTEGRITY_PROTOCOLS
     * Prevents non-authorized entities from destroying shop nodes or 
     * their linked storage containers. 
     */
    Kernel.world.beforeEvents.playerBreakBlock.subscribe((event) => {
        const block = event.block
        const player = event.player
        if (!block || !player) return

        if (player.hasTag("Admin") || player.hasTag("admin") || player.hasTag("AE")) return

        const ChestShopStore = Kernel.get("chestShopStore")
        if (block.typeId.includes("sign")) {
            const shop = ChestShopStore.getShop(block.location)
            if (shop && shop.ownerId !== player.id) {
                event.cancel = true
                player.onScreenDisplay.setActionBar("§c§l» §7This shop belongs to someone else!");
                return
            }

            if (shop && shop.ownerId === player.id) {
                ChestShopStore.removeShop(block.location)
                Kernel.system.run(() => player.sendMessage("§a§l» §fShop removed."));
            }

            return
        }

        const linkedShop = ChestShopStore.findShopByChestLocation(block.location)
        if (linkedShop && linkedShop.ownerId !== player.id) {
            event.cancel = true
            player.onScreenDisplay.setActionBar("§c§l» §7This chest is linked to a shop!");
        }


    })

    console.log("[ChestShopHandler] TRANSACTIONAL_PIPELINE_ONLINE");
}

/* 
 * CARDINAL_ADJACENCY_SCANNER
 * Iterates through the 6 cardinal directions to find a valid container. 
 * Essential for linking the sign to the inventory buffer.
 */
function getChestAround(block) {
    const offsets = [
        { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
    ]

    const containerTypes = ["chest", "barrel", "trapped_chest", "shulker"]

    for (const offset of offsets) {
        try {
            const neighbor = block.offset(offset)
            if (neighbor && containerTypes.some(t => neighbor.typeId.includes(t))) {
                return neighbor
            }
        } catch {
            // SPATIAL_OVERFLOW
        }
    }
    return null
}

/*
 * TRANSACTION_PROCESSING_PIPELINE
 * Bridges the gap between the event hook and the sub-system logic. 
 * Validates container availability and routes to either handleBuy 
 * or handleSell based on the sign metadata.
 */
async function processTransaction(buyer, shop) {
    try {
        const dim = buyer.dimension
        const chestBlock = dim.getBlock(shop.chestLocation)
        if (!chestBlock) {
            buyer.sendMessage("§c§l» §7The shop's chest is missing!");
            return
        }


        const container = chestBlock.getComponent("minecraft:inventory")?.container
        if (!container) {
            buyer.sendMessage("§c§l» §7Could not open the shop's chest.");
            return
        }


        if (shop.type === "buy") {
            await handleBuy(buyer, shop, container)
        } else {
            await handleSell(buyer, shop, container)
        }
    } catch (error) {
        console.error(`[ChestShopHandler] TRANSACTION_CRASH: ${error}`)
        buyer.sendMessage("§c§l» §7Something went wrong with the transaction.");
    }

}

/*
 * INBOUND_TRANSACTION_HANDLER (BUY)
 * ----------------------------------------------------------------------------
 * 1. Calculate total liquidity requirement.
 * 2. Verify stock levels in the container buffer.
 * 3. Execute credit deduction via Economy service.
 * 4. Transfer item stack from container to buyer inventory.
 * 5. Credit the shop owner's balance.
 */
async function handleBuy(buyer, shop, container) {
    const totalCost = shop.price * shop.quantity
    const EconomyStore = Kernel.get("economy")
    const balance = EconomyStore.getBalance(buyer)

    if (balance < totalCost) {
        buyer.sendMessage("§c§l» §7You don't have enough money!");
        return
    }


    let stockCount = 0
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i)
        if (item && item.typeId === shop.itemId) {
            stockCount += item.amount
        }
    }

    if (stockCount < shop.quantity) {
        buyer.sendMessage("§c§l» §7This shop is out of stock!");
        return
    }


    const success = await EconomyStore.removeMoney(buyer, totalCost)
    if (!success) {
        buyer.sendMessage("§c§l» §7Failed to process payment.");
        return
    }


    const { ItemStack } = await import("@minecraft/server")
    const itemStack = new ItemStack(shop.itemId, shop.quantity)
    const buyerInv = buyer.getComponent("minecraft:inventory")?.container
    if (buyerInv) {
        buyerInv.addItem(itemStack)
    }

    let remaining = shop.quantity
    for (let i = 0; i < container.size && remaining > 0; i++) {
        const item = container.getItem(i)
        if (item && item.typeId === shop.itemId) {
            const take = Math.min(item.amount, remaining)
            if (take >= item.amount) {
                container.setItem(i, undefined)
            } else {
                item.amount -= take
                container.setItem(i, item)
            }
            remaining -= take
        }
    }

    const owner = Kernel.world.getAllPlayers().find(p => p.id === shop.ownerId)
    if (owner) {
        const EconomyStore = Kernel.get("economy")
        await EconomyStore.addMoney(owner, totalCost)
        owner.sendMessage(`§a§l» §fSold §e${shop.quantity}x ${shop.itemId} §fto §e${buyer.name}§f. Profit: §a$${totalCost}§f.`);
    }



    buyer.sendMessage(`§a§l» §fPurchased §e${shop.quantity}x ${shop.itemId} §ffor §a$${totalCost}§f.`);

}

/*
 * OUTBOUND_TRANSACTION_HANDLER (SELL)
 * ----------------------------------------------------------------------------
 * 1. Verify seller has sufficient item stock in their inventory.
 * 2. Calculate payment requirements.
 * 3. Add credits to the seller's balance.
 * 4. Transfer item stack from seller to shop container.
 */
async function handleSell(seller, shop, container) {
    const sellerInv = seller.getComponent("minecraft:inventory")?.container
    if (!sellerInv) return

    let sellerStock = 0
    for (let i = 0; i < sellerInv.size; i++) {
        const item = sellerInv.getItem(i)
        if (item && item.typeId === shop.itemId) {
            sellerStock += item.amount
        }
    }

    if (sellerStock < shop.quantity) {
        seller.sendMessage("§c§l» §7You don't have enough items to sell!");
        return
    }


    const totalPay = shop.price * shop.quantity
    const EconomyStore = Kernel.get("economy")
    const success = await EconomyStore.addMoney(seller, totalPay)
    if (!success) {
        seller.sendMessage("§c§l» §7Failed to process payment.");
        return
    }


    const { ItemStack } = await import("@minecraft/server")
    const itemStack = new ItemStack(shop.itemId, shop.quantity)
    container.addItem(itemStack)

    let remaining = shop.quantity
    for (let i = 0; i < sellerInv.size && remaining > 0; i++) {
        const item = sellerInv.getItem(i)
        if (item && item.typeId === shop.itemId) {
            const take = Math.min(item.amount, remaining)
            if (take >= item.amount) {
                sellerInv.setItem(i, undefined)
            } else {
                item.amount -= take
                sellerInv.setItem(i, item)
            }
            remaining -= take
        }
    }

    seller.sendMessage(`§a§l» §fSold §e${shop.quantity}x ${shop.itemId} §ffor §a$${totalPay}§f.`);

}

/*
 * COMMERCE_NODE_CONFIGURATION_UI
 * ----------------------------------------------------------------------------
 * Spawns a modal form to define the parameters of a new commerce node. 
 * Includes validation for ItemID syntax.
 */
async function showSetupUI(player, shopType, signLocation, chestLocation) {
    const { ModalFormData } = await import("@minecraft/server-ui")

    const form = new ModalFormData()
        .title("§6Shop Setup")
        .textField("Item ID (e.g. minecraft:diamond)", "minecraft:diamond")
        .slider("Price per Unit", 1, 10000, { defaultValue: 1, valueStep: 1 })
        .slider("Quantity per Trade", 1, 64, { defaultValue: 1, valueStep: 1 })



    const response = await form.show(player)
    if (response.canceled) return

    const itemId = String(response.formValues[0] || "").trim()
    const price = Number(response.formValues[1])
    const quantity = Number(response.formValues[2])

    if (!itemId || !itemId.includes(":")) {
        player.sendMessage("§c§l» §7Invalid Item ID. Example: 'minecraft:diamond'.");
        return
    }


    const ChestShopStore = Kernel.get("chestShopStore")
    const success = ChestShopStore.createShop({
        ownerId: player.id,
        ownerName: player.name,
        itemId,
        price,
        quantity,
        type: shopType,
        signLocation,
        chestLocation
    })

    if (success) {
        player.sendMessage(`§a§l» §fShop created successfully!`);
    } else {
        player.sendMessage("§c§l» §7Failed to create shop.");
    }

}
