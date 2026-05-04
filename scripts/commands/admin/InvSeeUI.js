/**
 * Inventory See UI - Paginated inventory viewer with management
 */

import { ActionFormData, MessageFormData } from "@minecraft/server-ui"
import { EntityComponentTypes, EquipmentSlot, system } from "@minecraft/server"

const ITEMS_PER_PAGE = 40

export async function showInventoryUI(viewer, target) {
    const inv = target.getComponent(EntityComponentTypes.Inventory)
    const equip = target.getComponent(EntityComponentTypes.Equippable)
    
    if (!inv?.container) {
        viewer.sendMessage(`§cCannot access ${target.name}'s inventory`)
        return
    }

    await showInventoryPage(viewer, target, inv.container, equip, 0)
}

async function showInventoryPage(viewer, target, container, equip, page) {
    const form = new ActionFormData()
        .title(`§6§l${target.name}'s Inventory`)
        .body(`Page ${page + 1}`)

    // Add armor slots on first page
    if (page === 0 && equip) {
        const headItem = equip.getEquipment(EquipmentSlot.Head)
        const chestItem = equip.getEquipment(EquipmentSlot.Chest)
        const legsItem = equip.getEquipment(EquipmentSlot.Legs)
        const feetItem = equip.getEquipment(EquipmentSlot.Feet)
        const offhandItem = equip.getEquipment(EquipmentSlot.Offhand)

        form.button(`§6Helmet: ${formatItemName(headItem)}`)
        form.button(`§6Chest: ${formatItemName(chestItem)}`)
        form.button(`§6Legs: ${formatItemName(legsItem)}`)
        form.button(`§6Boots: ${formatItemName(feetItem)}`)
        form.button(`§6Offhand: ${formatItemName(offhandItem)}`)
        form.button("§7--- Inventory Items ---")
    }

    // Collect inventory items
    const items = []
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i)
        if (item) {
            items.push({ item, slot: i })
        }
    }

    // Calculate pagination
    const startIndex = page * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length)
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)

    // Add items for current page
    for (let i = startIndex; i < endIndex; i++) {
        const { item, slot } = items[i]
        form.button(`§e${item.typeId.replace("minecraft:", "")} §7x${item.amount}`)
    }

    // Add navigation buttons
    if (totalPages > 1) {
        if (page > 0) {
            form.button("§c← Prev Page")
        }
        if (page < totalPages - 1) {
            form.button("§aNext Page →")
        }
    }

    form.button("§cClose")

    const res = await form.show(viewer)
    if (res.canceled) return

    const buttonIndex = res.selection
    const armorOffset = page === 0 && equip ? 6 : 0
    const navOffset = totalPages > 1 && page > 0 ? 1 : 0
    const nextNavOffset = totalPages > 1 && page < totalPages - 1 ? 1 : 0

    // Handle armor slots (first page only)
    if (page === 0 && equip && buttonIndex < 5) {
        const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet, EquipmentSlot.Offhand]
        const slot = slots[buttonIndex]
        await handleArmorSlot(viewer, target, equip, slot)
        return
    }

    // Handle navigation
    if (totalPages > 1) {
        if (page > 0 && buttonIndex === armorOffset) {
            await showInventoryPage(viewer, target, container, equip, page - 1)
            return
        }
        if (page < totalPages - 1 && buttonIndex === armorOffset + (page > 0 ? 1 : 0) + (endIndex - startIndex)) {
            await showInventoryPage(viewer, target, container, equip, page + 1)
            return
        }
    }

    // Handle inventory item selection
    const itemIndex = buttonIndex - armorOffset - navOffset
    if (itemIndex >= 0 && itemIndex < (endIndex - startIndex)) {
        const actualItemIndex = startIndex + itemIndex
        const { item, slot } = items[actualItemIndex]
        await handleItemAction(viewer, target, container, item, slot)
    }
}

async function handleArmorSlot(viewer, target, equip, slot) {
    const item = equip.getEquipment(slot)
    if (!item) {
        viewer.sendMessage("§cThis slot is empty")
        return
    }

    const form = new MessageFormData()
        .title(`§6§lRemove ${formatItemName(item)}`)
        .body(`Remove §e${item.typeId.replace("minecraft:", "")} §7x${item.amount} from ${slot} slot?`)
        .button1("§cCancel")
        .button2("§aRemove")

    const res = await form.show(viewer)
    if (!res.canceled && res.selection === 1) {
        system.run(() => {
            equip.setEquipment(slot, undefined)
            viewer.sendMessage(`§aRemoved ${item.typeId.replace("minecraft:", "")} from ${target.name}'s ${slot} slot`)
            
            // Re-open inventory view
            showInventoryUI(viewer, target)
        })
    }
}

async function handleItemAction(viewer, target, container, item, slot) {
    const form = new MessageFormData()
        .title(`§6§l${item.typeId.replace("minecraft:", "")}`)
        .body(`Remove §e${item.typeId.replace("minecraft:", "")} §7x${item.amount} from inventory?`)
        .button1("§cCancel")
        .button2("§aRemove")

    const res = await form.show(viewer)
    if (!res.canceled && res.selection === 1) {
        system.run(() => {
            container.setItem(slot, undefined)
            viewer.sendMessage(`§aRemoved ${item.typeId.replace("minecraft:", "")} x${item.amount} from ${target.name}'s inventory`)
            
            // Re-open inventory view
            showInventoryUI(viewer, target)
        })
    }
}

function formatItemName(item) {
    if (!item) return "§7Empty"
    return `§e${item.typeId.replace("minecraft:", "")} §7x${item.amount}`
}

