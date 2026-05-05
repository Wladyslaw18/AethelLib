import { ActionFormData, MessageFormData } from "@minecraft/server-ui"
import { EntityComponentTypes, EquipmentSlot, system } from "@minecraft/server"

/*
 * INDUSTRIAL_INVENTORY_AUDIT_UI
 * ----------------------------------------------------------------------------
 * A high-performance visual interface for monitoring and manipulating an 
 * entity's inventory and equipment buffers. Implements pagination for 
 * high-density inventory scans.
 *
 * PHILOSOPHY: If an entity possesses an unauthorized asset, decommission it. 
 * This UI provides the precision tools for asset removal.
 */

const ITEMS_PER_PAGE = 40 // SCAN_PAGINATION_LIMIT

/* 
 * UI_ENTRY_PIPELINE
 */
export async function showInventoryUI(viewer, target) {
    const inv = target.getComponent(EntityComponentTypes.Inventory)
    const equip = target.getComponent(EntityComponentTypes.Equippable)
    
    if (!inv?.container) {
        viewer.sendMessage(`[Error] Access violation: ${target.name}'s inventory buffer unreachable.`);
        return
    }

    await showInventoryPage(viewer, target, inv.container, equip, 0)
}

/* 
 * PAGE_RENDER_ENGINE
 * ----------------------------------------------------------------------------
 * Orchestrates the construction of the ActionForm. 
 * 1. Render equipment slots (Page 0 only).
 * 2. Scan and paginate inventory items.
 * 3. Render navigation and interaction buttons.
 */
async function showInventoryPage(viewer, target, container, equip, page) {
    const form = new ActionFormData()
        .title(`§6§lINVENTORY_AUDIT: ${target.name}`)
        .body(`Session_Page: ${page + 1}`)

    /* 
     * EQUIPMENT_BUFFER_SCAN
     */
    if (page === 0 && equip) {
        const slots = [
            { id: EquipmentSlot.Head, label: "HELMET" },
            { id: EquipmentSlot.Chest, label: "CHEST" },
            { id: EquipmentSlot.Legs, label: "LEGS" },
            { id: EquipmentSlot.Feet, label: "BOOTS" },
            { id: EquipmentSlot.Offhand, label: "OFFHAND" }
        ]

        slots.forEach(s => {
            const item = equip.getEquipment(s.id)
            form.button(`§6${s.label}: ${formatItemName(item)}`)
        })
        form.button("§7--- INVENTORY_BUFFER_MANIFEST ---")
    }

    /* 
     * INVENTORY_BUFFER_SCAN
     */
    const items = []
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i)
        if (item) {
            items.push({ item, slot: i })
        }
    }

    const startIndex = page * ITEMS_PER_PAGE
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length)
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)

    for (let i = startIndex; i < endIndex; i++) {
        const { item, slot } = items[i]
        form.button(`§e${item.typeId.replace("minecraft:", "")} §7x${item.amount}`)
    }

    /* 
     * NAVIGATION_ORCHESTRATION
     */
    if (totalPages > 1) {
        if (page > 0) form.button("§c← PREVIOUS_SEGMENT");
        if (page < totalPages - 1) form.button("§aNEXT_SEGMENT →");
    }

    form.button("§cTERMINATE_SESSION");

    const res = await form.show(viewer)
    if (res.canceled) return

    const buttonIndex = res.selection
    const armorOffset = page === 0 && equip ? 6 : 0
    const navOffset = totalPages > 1 && page > 0 ? 1 : 0

    /* 
     * INPUT_ROUTING_LOGIC
     */
    if (page === 0 && equip && buttonIndex < 5) {
        const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet, EquipmentSlot.Offhand]
        const slot = slots[buttonIndex]
        await handleArmorSlot(viewer, target, equip, slot)
        return
    }

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

    const itemIndex = buttonIndex - armorOffset - navOffset
    if (itemIndex >= 0 && itemIndex < (endIndex - startIndex)) {
        const actualItemIndex = startIndex + itemIndex
        const { item, slot } = items[actualItemIndex]
        await handleItemAction(viewer, target, container, item, slot)
    }
}

/* 
 * EQUIPMENT_DECOMMISSION_HANDLER
 */
async function handleArmorSlot(viewer, target, equip, slot) {
    const item = equip.getEquipment(slot)
    if (!item) {
        viewer.sendMessage("[Error] Target slot is currently empty.");
        return
    }

    const form = new MessageFormData()
        .title(`§6§lASSET_DECOMMISSION: ${slot.toUpperCase()}`)
        .body(`Initiate removal of §e${item.typeId.replace("minecraft:", "")} §7x${item.amount} from target buffer?`)
        .button1("§cABORT")
        .button2("§aCONFIRM_REMOVAL")

    const res = await form.show(viewer)
    if (!res.canceled && res.selection === 1) {
        system.run(() => {
            equip.setEquipment(slot, undefined)
            viewer.sendMessage(`[Success] Asset removed from ${target.name}'s ${slot} slot.`);
            showInventoryUI(viewer, target)
        })
    }
}

/* 
 * INVENTORY_DECOMMISSION_HANDLER
 */
async function handleItemAction(viewer, target, container, item, slot) {
    const form = new MessageFormData()
        .title(`§6§lASSET_DECOMMISSION: SLOT_${slot}`)
        .body(`Initiate removal of §e${item.typeId.replace("minecraft:", "")} §7x${item.amount} from inventory buffer?`)
        .button1("§cABORT")
        .button2("§aCONFIRM_REMOVAL")

    const res = await form.show(viewer)
    if (!res.canceled && res.selection === 1) {
        system.run(() => {
            container.setItem(slot, undefined)
            viewer.sendMessage(`[Success] Asset removed from ${target.name}'s inventory buffer.`);
            showInventoryUI(viewer, target)
        })
    }
}

/* 
 * ASSET_NAME_FORMATTER
 */
function formatItemName(item) {
    if (!item) return "§7[VACANT]"
    return `§e${item.typeId.replace("minecraft:", "")} §7x${item.amount}`
}
